package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminOrderService {

    private final JdbcTemplate jdbc;
    private final LogService logService;
    private final NotificationService notificationService;

    public AdminOrderService(JdbcTemplate jdbc, LogService logService, NotificationService notificationService) {
        this.jdbc = jdbc;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list() {
        Map<Long, Map<String, Object>> orders = new LinkedHashMap<>();
        jdbc.query("""
                SELECT o.id, o.order_code, o.status, o.payment_method, o.payment_status,
                       o.subtotal_amount, o.discount_amount, o.shipping_fee, o.total_amount,
                       o.created_at, o.recipient_name, o.recipient_phone, o.delivery_address, o.delivery_note,
                       o.partner_id, partner.full_name AS partner_name, o.design_request_id,
                       customer.full_name AS customer_name, customer.email AS customer_email,
                       customer.phone AS customer_phone, o.completion_image_url,
                       invoice.invoice_number, invoice.sent_at AS invoice_sent_at,
                       oi.item_name, oi.item_description, oi.material, oi.quantity, oi.unit_price, oi.subtotal,
                       product.thumbnail_url
                FROM orders o
                JOIN users customer ON customer.id = o.customer_id
                LEFT JOIN users partner ON partner.id = o.partner_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                LEFT JOIN products product ON product.id = oi.product_id
                LEFT JOIN invoices invoice ON invoice.order_id = o.id
                ORDER BY o.created_at DESC, o.id DESC, oi.id
                """, rs -> {
            long id = rs.getLong("id");
            Map<String, Object> order = orders.computeIfAbsent(id, ignored -> orderFrom(rs));
            String itemName = getString(rs, "item_name");
            if (itemName != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> items = (List<Map<String, Object>>) order.get("items");
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("item_name", itemName);
                item.put("item_description", getString(rs, "item_description"));
                item.put("material", getString(rs, "material"));
                item.put("quantity", rs.getLong("quantity"));
                item.put("unit_price", rs.getBigDecimal("unit_price"));
                item.put("subtotal", rs.getBigDecimal("subtotal"));
                item.put("thumbnail_url", getString(rs, "thumbnail_url"));
                items.add(item);
            }
        });
        return new ArrayList<>(orders.values());
    }

    @Transactional
    public void cancelUnclaimed(User manager, Long orderId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT order_code, customer_id, partner_id, design_request_id, status
                FROM orders WHERE id = ? FOR UPDATE
                """, orderId);
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }

        Map<String, Object> order = rows.get(0);
        if (!"PENDING".equals(order.get("status")) || order.get("partner_id") != null
                || order.get("design_request_id") != null) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chỉ có thể huỷ đơn mẫu hoa đang chờ và chưa có Đối tác nhận.");
        }

        int updated = jdbc.update("""
                UPDATE orders SET status = 'CANCELLED'
                WHERE id = ? AND status = 'PENDING' AND partner_id IS NULL AND design_request_id IS NULL
                """, orderId);
        if (updated == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn hàng đã thay đổi trạng thái.");
        }

        String orderCode = (String) order.get("order_code");
        Long customerId = ((Number) order.get("customer_id")).longValue();
        logService.write(manager, "ORDER_CANCEL", "orders", orderId,
                "Huỷ đơn chưa có Đối tác nhận " + orderCode + ".");
        notificationService.notify(customerId, "ORDER_CANCELLED", "Đơn hàng đã bị huỷ",
                "Đơn " + orderCode + " đã được Quản lý huỷ vì chưa có Đối tác nhận.",
                "account/orders.html");
    }

    private static Map<String, Object> orderFrom(ResultSet rs) {
        try {
            Map<String, Object> order = new LinkedHashMap<>();
            order.put("id", rs.getLong("id"));
            order.put("order_code", rs.getString("order_code"));
            order.put("status", rs.getString("status"));
            order.put("payment_method", rs.getString("payment_method"));
            order.put("payment_status", rs.getString("payment_status"));
            order.put("subtotal_amount", rs.getBigDecimal("subtotal_amount"));
            order.put("discount_amount", rs.getBigDecimal("discount_amount"));
            order.put("shipping_fee", rs.getBigDecimal("shipping_fee"));
            order.put("total_amount", rs.getBigDecimal("total_amount"));
            order.put("created_at", rs.getTimestamp("created_at").toLocalDateTime());
            order.put("recipient_name", rs.getString("recipient_name"));
            order.put("recipient_phone", rs.getString("recipient_phone"));
            order.put("delivery_address", rs.getString("delivery_address"));
            order.put("delivery_note", rs.getString("delivery_note"));
            order.put("partner_id", nullableLong(rs, "partner_id"));
            order.put("partner_name", rs.getString("partner_name"));
            order.put("design_request_id", nullableLong(rs, "design_request_id"));
            order.put("customer_name", rs.getString("customer_name"));
            order.put("customer_email", rs.getString("customer_email"));
            order.put("customer_phone", rs.getString("customer_phone"));
            order.put("completion_image_url", rs.getString("completion_image_url"));
            order.put("invoice_number", rs.getString("invoice_number"));
            order.put("invoice_sent_at", rs.getTimestamp("invoice_sent_at") == null
                    ? null : rs.getTimestamp("invoice_sent_at").toLocalDateTime());
            order.put("items", new ArrayList<Map<String, Object>>());
            return order;
        } catch (SQLException e) {
            throw new IllegalStateException("Không đọc được dữ liệu đơn hàng quản trị.", e);
        }
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static String getString(ResultSet rs, String column) {
        try {
            return rs.getString(column);
        } catch (SQLException e) {
            throw new IllegalStateException("Không đọc được chi tiết đơn hàng.", e);
        }
    }
}
