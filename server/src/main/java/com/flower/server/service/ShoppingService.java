package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ShoppingService {
    private final JdbcTemplate jdbc;
    private final LogService logs;
    private final NotificationService notifications;
    private final InvoiceMailService invoiceMail;

    public ShoppingService(JdbcTemplate jdbc, LogService logs, NotificationService notifications,
                           InvoiceMailService invoiceMail) {
        this.jdbc = jdbc;
        this.logs = logs;
        this.notifications = notifications;
        this.invoiceMail = invoiceMail;
    }

    public List<Map<String,Object>> products(String q, String materials, BigDecimal min, BigDecimal max, String sort, int page) {
        StringBuilder sql = new StringBuilder("""
            SELECT p.id,p.name,p.material,p.price,p.discount_price,p.thumbnail_url,p.stock_quantity,
                   u.full_name AS partner_name, COALESCE(bs.total_sold,0) AS total_sold,
                   COALESCE(rv.rating,0) AS rating
            FROM products p JOIN users u ON u.id=p.partner_id
            LEFT JOIN v_best_seller_products bs ON bs.id=p.id
            LEFT JOIN (SELECT product_id,AVG(rating) rating FROM reviews WHERE product_id IS NOT NULL GROUP BY product_id) rv ON rv.product_id=p.id
            WHERE p.status='APPROVED'
            """);
        List<Object> args = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            sql.append(" AND (p.name LIKE ? OR p.description LIKE ?)");
            args.add("%"+q.trim()+"%"); args.add("%"+q.trim()+"%");
        }
        if (materials != null && !materials.isBlank()) {
            String[] ms = Arrays.stream(materials.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);
            if (ms.length > 0) {
                sql.append(" AND p.material IN (").append(String.join(",", Collections.nCopies(ms.length, "?"))).append(")");
                args.addAll(Arrays.asList(ms));
            }
        }
        sql.append(" AND COALESCE(p.discount_price,p.price)>=?"); args.add(min == null ? BigDecimal.ZERO : min);
        if (max != null) { sql.append(" AND COALESCE(p.discount_price,p.price)<=?"); args.add(max); }
        String order = switch (sort == null ? "popular" : sort) {
            case "newest" -> "p.created_at DESC";
            case "price-asc" -> "COALESCE(p.discount_price,p.price) ASC";
            case "price-desc" -> "COALESCE(p.discount_price,p.price) DESC";
            default -> "total_sold DESC,p.created_at DESC";
        };
        sql.append(" ORDER BY ").append(order).append(" LIMIT 12 OFFSET ?");
        args.add(Math.max(0,page)*12);
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    public List<Map<String,Object>> bestSellers() {
        return jdbc.queryForList("""
            SELECT p.id,p.name,p.material,p.price,p.discount_price,p.thumbnail_url,p.stock_quantity,
                   u.full_name partner_name,COALESCE(bs.total_sold,0) total_sold,COALESCE(rv.rating,0) rating
            FROM v_best_seller_products bs JOIN products p ON p.id=bs.id JOIN users u ON u.id=p.partner_id
            LEFT JOIN (SELECT product_id,AVG(rating) rating FROM reviews WHERE product_id IS NOT NULL GROUP BY product_id) rv ON rv.product_id=p.id
            WHERE p.status='APPROVED' ORDER BY bs.total_sold DESC LIMIT 8
            """);
    }

    public List<Map<String,Object>> newProducts() {
        return jdbc.queryForList("""
            SELECT p.id,p.name,p.material,p.price,p.discount_price,p.thumbnail_url,p.stock_quantity,
                   u.full_name partner_name,COALESCE(rv.rating,0) rating,p.created_at
            FROM products p JOIN users u ON u.id=p.partner_id
            LEFT JOIN (SELECT product_id,AVG(rating) rating FROM reviews WHERE product_id IS NOT NULL GROUP BY product_id) rv ON rv.product_id=p.id
            WHERE p.status='APPROVED' ORDER BY p.created_at DESC LIMIT 8
            """);
    }

    public Map<String,Object> product(long id) {
        List<Map<String,Object>> rows = jdbc.queryForList("""
            SELECT p.*,u.full_name partner_name,COALESCE(rv.rating,0) rating,COALESCE(rv.review_count,0) review_count,
                   COALESCE(bs.total_sold,0) total_sold
            FROM products p JOIN users u ON u.id=p.partner_id
            LEFT JOIN (SELECT product_id,AVG(rating) rating,COUNT(*) review_count FROM reviews WHERE product_id IS NOT NULL GROUP BY product_id) rv ON rv.product_id=p.id
            LEFT JOIN v_best_seller_products bs ON bs.id=p.id
            WHERE p.id=? AND p.status='APPROVED'
            """, id);
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND,"Không tìm thấy sản phẩm.");
        Map<String,Object> p = new LinkedHashMap<>(rows.get(0));
        p.put("images", jdbc.queryForList("SELECT image_url FROM product_images WHERE product_id=? ORDER BY sort_order,id", id)
                .stream().map(x -> x.get("image_url")).toList());
        return p;
    }

    public List<Map<String,Object>> reviews(long id) {
        return jdbc.queryForList("""
            SELECT u.full_name author,r.rating,r.comment content,r.image_url,r.created_at
            FROM reviews r JOIN users u ON u.id=r.customer_id WHERE r.product_id=? ORDER BY r.created_at DESC
            """, id);
    }

    public List<Map<String,Object>> comments(long id) {
        return jdbc.queryForList("""
            SELECT c.id,c.content,c.created_at,u.full_name author,c.parent_comment_id
            FROM product_comments c JOIN users u ON u.id=c.customer_id
            WHERE c.product_id=? ORDER BY c.created_at DESC
            """, id);
    }

    public boolean canComment(User user, long productId) {
        Integer n=jdbc.queryForObject("""
            SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id=oi.order_id
            WHERE o.customer_id=? AND o.status='RECEIVED' AND oi.product_id=?
            """, Integer.class,user.getId(),productId);
        return n != null && n > 0;
    }

    @Transactional
    public void addComment(User user,long productId,String content) {
        if (content == null || content.trim().length()<5 || content.trim().length()>1000)
            throw new ApiException(HttpStatus.BAD_REQUEST,"Bình luận phải từ 5 đến 1000 ký tự.");
        if (!canComment(user,productId))
            throw new ApiException(HttpStatus.FORBIDDEN,"Chỉ khách đã mua và nhận sản phẩm mới được bình luận.");
        Long orderId=jdbc.query("""
            SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id=o.id
            WHERE o.customer_id=? AND o.status='RECEIVED' AND oi.product_id=? ORDER BY o.received_at DESC LIMIT 1
            """, rs -> rs.next() ? rs.getLong(1) : null, user.getId(),productId);
        jdbc.update("INSERT INTO product_comments(product_id,customer_id,order_id,content) VALUES(?,?,?,?)",
                productId,user.getId(),orderId,content.trim());
    }

    public Map<String,Object> cart(User user) { return cartData(user.getId()); }

    @Transactional
    public Map<String,Object> addCartItem(User user,long productId,int quantity,String note) {
        if (quantity < 1) throw new ApiException(HttpStatus.BAD_REQUEST,"Số lượng phải từ 1 trở lên.");
        Map<String,Object> p = product(productId);
        int stock = ((Number)p.get("stock_quantity")).intValue();
        if (stock < 1 || quantity > stock) throw new ApiException(HttpStatus.BAD_REQUEST,"Số lượng vượt quá tồn kho hiện có.");
        Long cartId = ensureCart(user.getId());
        Integer current = jdbc.query("SELECT quantity FROM cart_items WHERE cart_id=? AND product_id=?", rs -> rs.next()?rs.getInt(1):null,cartId,productId);
        if (current != null && current + quantity > stock) throw new ApiException(HttpStatus.BAD_REQUEST,"Số lượng vượt quá tồn kho hiện có.");
        jdbc.update("INSERT INTO cart_items(cart_id,product_id,quantity,note) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity),note=VALUES(note)",cartId,productId,quantity,note == null || note.isBlank()?null:note.trim());
        return cartData(user.getId());
    }

    @Transactional
    public Map<String,Object> setCartQuantity(User user,long productId,int quantity) {
        if (quantity < 1) throw new ApiException(HttpStatus.BAD_REQUEST,"Số lượng phải từ 1 trở lên.");
        Map<String,Object> p=product(productId);
        int stock=((Number)p.get("stock_quantity")).intValue();
        if(quantity>stock) throw new ApiException(HttpStatus.BAD_REQUEST,"Số lượng vượt quá tồn kho hiện có.");
        Long cartId=ensureCart(user.getId());
        int changed=jdbc.update("UPDATE cart_items SET quantity=? WHERE cart_id=? AND product_id=?",quantity,cartId,productId);
        if(changed==0) throw new ApiException(HttpStatus.NOT_FOUND,"Sản phẩm không có trong giỏ hàng.");
        return cartData(user.getId());
    }

    @Transactional
    public Map<String,Object> deleteCartItem(User user,long productId) {
        Long cartId=ensureCart(user.getId());
        jdbc.update("DELETE FROM cart_items WHERE cart_id=? AND product_id=?",cartId,productId);
        return cartData(user.getId());
    }

    public Map<String,Object> validateVoucher(User user,String code) {
        Map<String,Object> cart=cartData(user.getId());
        BigDecimal subtotal=(BigDecimal)cart.get("subtotal");
        if(code==null || code.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST,"Vui lòng nhập mã voucher.");
        List<Map<String,Object>> rows=jdbc.queryForList("SELECT * FROM vouchers WHERE UPPER(code)=UPPER(?) AND status='ACTIVE' AND valid_from<=NOW() AND valid_to>=NOW() AND (usage_limit IS NULL OR used_count<usage_limit)",code.trim());
        if(rows.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST,"Mã voucher không hợp lệ hoặc đã hết hạn.");
        Map<String,Object> v=rows.get(0);
        BigDecimal min=money(v.get("min_order_amount"));
        if(subtotal.compareTo(min)<0) throw new ApiException(HttpStatus.BAD_REQUEST,"Đơn hàng chưa đạt giá trị tối thiểu để áp dụng voucher.");
        BigDecimal discount;
        if("PERCENT".equals(v.get("discount_type"))) {
            discount=subtotal.multiply(money(v.get("discount_value"))).divide(new BigDecimal("100"),0,java.math.RoundingMode.DOWN);
            if(v.get("max_discount_amount")!=null) discount=discount.min(money(v.get("max_discount_amount")));
        } else discount=money(v.get("discount_value"));
        discount=discount.min(subtotal);
        Map<String,Object> result=new LinkedHashMap<>(); result.put("code",v.get("code")); result.put("discount",discount); result.put("subtotal",subtotal); result.put("total",subtotal.subtract(discount));
        return result;
    }

    @Transactional
    public Map<String,Object> createOrder(User user,Map<String,Object> body) {
        String recipientName=str(body,"recipient_name"), phone=str(body,"recipient_phone"), address=str(body,"delivery_address"), note=str(body,"delivery_note");
        if(recipientName.isBlank() || recipientName.length()>150) throw new ApiException(HttpStatus.BAD_REQUEST,"Tên người nhận không hợp lệ.");
        if(!phone.matches("^0\\d{9}$")) throw new ApiException(HttpStatus.BAD_REQUEST,"Số điện thoại phải gồm 10 số và bắt đầu bằng 0.");
        if(address.isBlank() || address.length()>500) throw new ApiException(HttpStatus.BAD_REQUEST,"Địa chỉ giao hàng không hợp lệ.");
        if(note.length()>300) throw new ApiException(HttpStatus.BAD_REQUEST,"Ghi chú tối đa 300 ký tự.");
        String quoteText=str(body,"quote_id");
        boolean quoteOrder=!quoteText.isBlank() && !"null".equalsIgnoreCase(quoteText);
        List<Map<String,Object>> lines;
        Long quoteId=null, partnerId=null, designRequestId=null;
        if(quoteOrder) {
            try { quoteId=Long.valueOf(quoteText); } catch(Exception e){throw new ApiException(HttpStatus.BAD_REQUEST,"Báo giá không hợp lệ.");}
            lines=jdbc.queryForList("""
                SELECT q.id quote_id,q.request_id design_request_id,q.partner_id,q.price unit_price,
                       dr.title name,dr.description item_description,dr.quantity, u.full_name partner_name,
                       NULL product_id,NULL thumbnail_url
                FROM design_quotes q JOIN design_requests dr ON dr.id=q.request_id JOIN users u ON u.id=q.partner_id
                WHERE q.id=? AND dr.customer_id=? AND q.status='SELECTED' AND dr.status='CONFIRMED'
                """,quoteId,user.getId());
            if(lines.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST,"Không tìm thấy báo giá đã chọn để thanh toán.");
            Map<String,Object> line=lines.get(0); partnerId=asLong(line.get("partner_id")); designRequestId=asLong(line.get("design_request_id"));
        } else {
            Map<String,Object> c=cartData(user.getId());
            @SuppressWarnings("unchecked") List<Map<String,Object>> cartLines=(List<Map<String,Object>>)c.get("lines");
            if(cartLines.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST,"Giỏ hàng đang trống.");
            lines=cartLines;
        }
        BigDecimal subtotal=BigDecimal.ZERO;
        for(Map<String,Object> line:lines) {
            BigDecimal unit=money(line.get("unit_price")); int qty=((Number)line.get("quantity")).intValue();
            subtotal=subtotal.add(unit.multiply(BigDecimal.valueOf(qty)));
            if(!quoteOrder) {
                int stock=((Number)line.get("stock_quantity")).intValue();
                if(qty>stock || stock<1) throw new ApiException(HttpStatus.BAD_REQUEST,"Sản phẩm \""+line.get("name")+"\" không đủ tồn kho.");
            }
        }
        BigDecimal discount=BigDecimal.ZERO; Long voucherId=null; String voucherCode=str(body,"voucher_code");
        if(!quoteOrder && !voucherCode.isBlank()) {
            Map<String,Object> v=validateVoucher(user,voucherCode); discount=money(v.get("discount"));
            voucherId=jdbc.query("SELECT id FROM vouchers WHERE code=?",rs->rs.next()?rs.getLong(1):null,String.valueOf(v.get("code")));
        }
        BigDecimal shipping=BigDecimal.ZERO, total=subtotal.subtract(discount).add(shipping);
        String code="FW"+LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"))+String.format("%02d",new Random().nextInt(100));
        jdbc.update("""
            INSERT INTO orders(order_code,customer_id,partner_id,design_request_id,voucher_id,status,payment_method,payment_status,
              recipient_name,recipient_phone,delivery_address,delivery_note,subtotal_amount,shipping_fee,discount_amount,total_amount)
            VALUES(?,?,?,?,?,'PENDING','BANK_TRANSFER','UNPAID',?,?,?,?,?,?,?,?)
            """,code,user.getId(),partnerId,designRequestId,voucherId,recipientName,phone,address,note.isBlank()?null:note,subtotal,shipping,discount,total);
        Long orderId=jdbc.query("SELECT id FROM orders WHERE order_code=?",rs->rs.next()?rs.getLong(1):null,code);
        for(Map<String,Object> line:lines) {
            BigDecimal unit=money(line.get("unit_price")); int qty=((Number)line.get("quantity")).intValue();
            jdbc.update("""
                INSERT INTO order_items(order_id,product_id,quote_id,item_name,item_description,material,unit_price,quantity,subtotal)
                VALUES(?,?,?,?,?,?,?,?,?)
                """,orderId,asLong(line.get("product_id")),asLong(line.get("quote_id")),String.valueOf(line.get("name")),line.get("item_description"),line.get("material"),unit,qty,unit.multiply(BigDecimal.valueOf(qty)));
        }
        return Map.of("id",orderId,"code",code,"order_code",code,"subtotal",subtotal,"discount",discount,"shipping_fee",shipping,"total",total,"status","PENDING");
    }

    @Transactional
    public Map<String,Object> pay(User user,String code) {
        Map<String,Object> order=findOrder(code,user);
        if("PAID".equals(order.get("payment_status"))) return orderByCode(code,user);
        if(!"PENDING".equals(order.get("status"))) throw new ApiException(HttpStatus.BAD_REQUEST,"Đơn hàng không còn ở trạng thái chờ thanh toán.");
        Long orderId=asLong(order.get("id"));
        List<Map<String,Object>> items=jdbc.queryForList("SELECT product_id,quantity,item_name FROM order_items WHERE order_id=?",orderId);
        for(Map<String,Object> item:items) {
            Long productId=asLong(item.get("product_id")); if(productId==null) continue;
            int qty=((Number)item.get("quantity")).intValue();
            int changed=jdbc.update("UPDATE products SET stock_quantity=stock_quantity-? WHERE id=? AND status='APPROVED' AND stock_quantity>=?",qty,productId,qty);
            if(changed==0) throw new ApiException(HttpStatus.CONFLICT,"Sản phẩm \""+item.get("item_name")+"\" vừa hết hàng hoặc không đủ tồn kho.");
        }
        jdbc.update("UPDATE orders SET payment_status='PAID',payment_method='BANK_TRANSFER' WHERE id=?",orderId);
        jdbc.update("INSERT INTO payments(order_id,method,amount,status,paid_at) VALUES(?,'BANK_TRANSFER',?,'SUCCESS',NOW())",orderId,order.get("total_amount"));
        if(order.get("voucher_id")!=null) jdbc.update("UPDATE vouchers SET used_count=used_count+1 WHERE id=? AND (usage_limit IS NULL OR used_count<usage_limit)",order.get("voucher_id"));
        if(order.get("design_request_id")==null) {
            Long cartId=ensureCart(user.getId());
            jdbc.update("DELETE FROM cart_items WHERE cart_id=?",cartId);
        }
        Object partner=order.get("partner_id"); if(partner!=null) notifications.notify(asLong(partner),"ORDER_PAID","Đơn hàng mới đã thanh toán","Đơn "+code+" đã được thanh toán.","partner/orders.html");
        logs.write(user,"ORDER_PAY","orders",orderId,"Thanh toán mô phỏng thành công cho đơn "+code+".");
        return orderByCode(code,user);
    }

    public Map<String,Object> orderByCode(String code,User user) {
        Map<String,Object> order=findOrder(code,user);
        Map<String,Object> result=new LinkedHashMap<>(order);
        result.put("lines",jdbc.queryForList("SELECT item_name,quantity,unit_price,subtotal,material,product_id,quote_id FROM order_items WHERE order_id=? ORDER BY id",order.get("id")));
        return result;
    }

    private Map<String,Object> findOrder(String code,User user) {
        List<Map<String,Object>> rows=jdbc.queryForList("SELECT * FROM orders WHERE order_code=? AND customer_id=?",code,user.getId());
        if(rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND,"Không tìm thấy đơn hàng.");
        return rows.get(0);
    }

    private void createInvoice(Long orderId,String code) {
        jdbc.update("INSERT INTO invoices(order_id,invoice_number) VALUES(?,?) ON DUPLICATE KEY UPDATE order_id=VALUES(order_id)",orderId,"INV-"+code);
    }

    public Map<String,Object> sendInvoice(User user,String code,String email) {
        if(email==null || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new ApiException(HttpStatus.BAD_REQUEST,"Email không hợp lệ.");
        Map<String,Object> order=findOrder(code,user);
        if(!"PAID".equals(order.get("payment_status"))) throw new ApiException(HttpStatus.BAD_REQUEST,"Chỉ gửi hóa đơn cho đơn đã thanh toán.");
        Long orderId=asLong(order.get("id")); createInvoice(orderId,code);
        Timestamp sentAt=jdbc.query("SELECT sent_at FROM invoices WHERE order_id=?",rs->rs.next()?rs.getTimestamp(1):null,orderId);
        if(sentAt!=null && sentAt.toLocalDateTime().isAfter(LocalDateTime.now().minusMinutes(1)))
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"Vui lòng chờ ít nhất 1 phút trước khi gửi lại hóa đơn.");
        boolean sent=sendInvoiceEmail(orderId,code,email);
        if(!sent) return Map.of("ok",false,"message","Chưa gửi được email. Hãy kiểm tra cấu hình SMTP (MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM).");
        logs.write(user,"INVOICE_SEND","invoices",orderId,"Đã gửi hóa đơn "+code+" tới "+email+".");
        return Map.of("ok",true,"message","Đã gửi hóa đơn tới "+email+".");
    }

    private boolean sendInvoiceEmail(Long orderId,String orderCode,String email) {
        if(email==null || email.isBlank()) return false;
        List<Map<String,Object>> invoiceRows=jdbc.queryForList("""
            SELECT i.invoice_number,o.recipient_name,o.recipient_phone,o.delivery_address,
                   o.subtotal_amount,o.discount_amount,o.shipping_fee,o.total_amount
            FROM invoices i JOIN orders o ON o.id=i.order_id WHERE i.order_id=?
            """,orderId);
        if(invoiceRows.isEmpty()) return false;
        Map<String,Object> inv=invoiceRows.get(0);
        List<Map<String,Object>> lines=jdbc.queryForList("SELECT item_name,quantity,subtotal FROM order_items WHERE order_id=? ORDER BY id",orderId);
        boolean sent=invoiceMail.sendInvoice(email,String.valueOf(inv.get("invoice_number")),orderCode,lines,
                money(inv.get("subtotal_amount")),money(inv.get("discount_amount")),money(inv.get("shipping_fee")),money(inv.get("total_amount")),
                String.valueOf(inv.get("recipient_name")),String.valueOf(inv.get("recipient_phone")),String.valueOf(inv.get("delivery_address")));
        if(sent) jdbc.update("UPDATE invoices SET sent_at=NOW() WHERE order_id=?",orderId);
        return sent;
    }

    public List<Map<String,Object>> recommendations(User user) {
        Integer purchased=jdbc.queryForObject("""
            SELECT COUNT(*) FROM orders o JOIN order_items oi ON oi.order_id=o.id
            WHERE o.customer_id=? AND o.payment_status='PAID' AND o.status<>'CANCELLED' AND oi.product_id IS NOT NULL
            """,Integer.class,user.getId());
        if(purchased==null || purchased==0) return bestSellers();
        return jdbc.queryForList("""
            SELECT p.id,p.name,p.material,p.price,p.discount_price,p.thumbnail_url,p.stock_quantity,
                   u.full_name partner_name,COALESCE(bs.total_sold,0) total_sold,COALESCE(rv.rating,0) rating
            FROM products p JOIN users u ON u.id=p.partner_id
            LEFT JOIN v_best_seller_products bs ON bs.id=p.id
            LEFT JOIN (SELECT product_id,AVG(rating) rating FROM reviews WHERE product_id IS NOT NULL GROUP BY product_id) rv ON rv.product_id=p.id
            WHERE p.status='APPROVED' AND p.id NOT IN (
              SELECT oi.product_id FROM order_items oi JOIN orders o ON o.id=oi.order_id
              WHERE o.customer_id=? AND o.payment_status='PAID' AND o.status<>'CANCELLED' AND oi.product_id IS NOT NULL)
            ORDER BY (CASE WHEN p.material=(SELECT oi.material FROM order_items oi JOIN orders o ON o.id=oi.order_id
                WHERE o.customer_id=? AND o.payment_status='PAID' AND o.status<>'CANCELLED' AND oi.material IS NOT NULL
                GROUP BY oi.material ORDER BY SUM(oi.quantity) DESC LIMIT 1) THEN 3 ELSE 0 END +
              CASE WHEN ABS(COALESCE(p.discount_price,p.price)-(SELECT AVG(oi.unit_price) FROM order_items oi JOIN orders o ON o.id=oi.order_id
                WHERE o.customer_id=? AND o.payment_status='PAID' AND o.status<>'CANCELLED')) <=
                (SELECT AVG(oi.unit_price)*0.3 FROM order_items oi JOIN orders o ON o.id=oi.order_id
                WHERE o.customer_id=? AND o.payment_status='PAID' AND o.status<>'CANCELLED') THEN 2 ELSE 0 END) DESC,
              COALESCE(bs.total_sold,0) DESC,p.created_at DESC LIMIT 8
            """,user.getId(),user.getId(),user.getId(),user.getId());
    }

    public List<Map<String,Object>> related(long id) {
        product(id);
        return jdbc.queryForList("""
            SELECT p.id,p.name,p.material,p.price,p.discount_price,p.thumbnail_url,u.full_name partner_name,COALESCE(bs.total_sold,0) total_sold
            FROM products p JOIN users u ON u.id=p.partner_id LEFT JOIN v_best_seller_products bs ON bs.id=p.id
            WHERE p.status='APPROVED' AND p.id<>?
            ORDER BY (SELECT COUNT(*) FROM order_items a JOIN order_items b ON a.order_id=b.order_id JOIN orders o ON o.id=a.order_id
              WHERE a.product_id=? AND b.product_id=p.id AND o.status<>'CANCELLED') DESC,
              (p.material=(SELECT material FROM products WHERE id=?))*3 DESC,
              (ABS(COALESCE(p.discount_price,p.price)-(SELECT COALESCE(discount_price,price) FROM products WHERE id=?)) <=
                (SELECT COALESCE(discount_price,price)*0.3 FROM products WHERE id=?))*2 DESC,
              (p.partner_id=(SELECT partner_id FROM products WHERE id=?)) DESC,COALESCE(bs.total_sold,0) DESC LIMIT 8
            """,id,id,id,id,id,id);
    }

    private Long ensureCart(Long customerId) {
        jdbc.update("INSERT INTO carts(customer_id) VALUES(?) ON DUPLICATE KEY UPDATE customer_id=VALUES(customer_id)",customerId);
        return jdbc.query("SELECT id FROM carts WHERE customer_id=?",rs->rs.next()?rs.getLong(1):null,customerId);
    }

    private Map<String,Object> cartData(Long customerId) {
        Long cartId=ensureCart(customerId);
        List<Map<String,Object>> lines=jdbc.queryForList("""
            SELECT ci.product_id,ci.quantity,ci.note,p.name,p.material,p.price,p.discount_price,p.thumbnail_url,p.stock_quantity,
                   u.full_name partner_name,COALESCE(p.discount_price,p.price) unit_price
            FROM cart_items ci JOIN products p ON p.id=ci.product_id JOIN users u ON u.id=p.partner_id
            WHERE ci.cart_id=? AND p.status='APPROVED' ORDER BY ci.created_at DESC
            """,cartId);
        BigDecimal subtotal=BigDecimal.ZERO;
        for(Map<String,Object> line:lines) subtotal=subtotal.add(money(line.get("unit_price")).multiply(BigDecimal.valueOf(((Number)line.get("quantity")).intValue())));
        Map<String,Object> result=new LinkedHashMap<>(); result.put("lines",lines); result.put("subtotal",subtotal); return result;
    }

    private static BigDecimal money(Object value) {
        if(value==null) return BigDecimal.ZERO;
        if(value instanceof BigDecimal b) return b;
        if(value instanceof Number n) return new BigDecimal(n.toString());
        try { return new BigDecimal(value.toString()); } catch(Exception e) { return BigDecimal.ZERO; }
    }
    private static String str(Map<String,Object> body,String key) { Object v=body.get(key); return v==null?"":String.valueOf(v).trim(); }
    private static Long asLong(Object value) { if(value==null) return null; if(value instanceof Number n) return n.longValue(); try{return Long.valueOf(value.toString());}catch(Exception e){return null;} }
}
