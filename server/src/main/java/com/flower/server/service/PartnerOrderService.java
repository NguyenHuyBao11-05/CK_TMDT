package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.PartnerOrderItem;
import com.flower.server.dto.PartnerOrderView;
import com.flower.server.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PartnerOrderService {

    private static final Set<String> ORDER_STATUSES =
            Set.of("PENDING", "PROCESSING", "SHIPPING", "RECEIVED", "CANCELLED");

    private final JdbcTemplate jdbc;
    private final LogService logService;
    private final NotificationService notificationService;
    private final Path uploadDir;

    public PartnerOrderService(JdbcTemplate jdbc, LogService logService, NotificationService notificationService,
                               @Value("${app.upload-dir}") String uploadDir) {
        this.jdbc = jdbc;
        this.logService = logService;
        this.notificationService = notificationService;
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public List<PartnerOrderView> available(User partner) {
        return queryOrders("v_available_orders o", """
                o.status = 'PENDING'
                AND o.partner_id IS NULL
                AND o.design_request_id IS NULL
                AND (o.payment_method = 'CASH'
                     OR (o.payment_method = 'BANK_TRANSFER' AND o.payment_status = 'PAID'))
                """);
    }

    @Transactional(readOnly = true)
    public List<PartnerOrderView> mine(User partner, String status) {
        if (status != null && !status.isBlank() && !ORDER_STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái đơn hàng không hợp lệ.");
        }
        if (status == null || status.isBlank()) {
            return queryOrders("orders o", "o.partner_id = ?", partner.getId());
        }
        return queryOrders("orders o", "o.partner_id = ? AND o.status = ?", partner.getId(), status);
    }

    @Transactional
    public void accept(User partner, Long orderId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT o.customer_id, o.order_code, o.partner_id, o.design_request_id,
                       o.payment_method, o.payment_status
                FROM orders o
                WHERE o.id = ?
                FOR UPDATE
                """, orderId);
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }

        Map<String, Object> order = rows.get(0);
        Object designRequestId = order.get("design_request_id");
        if (order.get("partner_id") != null || designRequestId != null
                || !isAvailablePayment(order.get("payment_method"), order.get("payment_status"))) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn đã có Đối tác khác nhận hoặc không còn khả dụng.");
        }

        int updated = jdbc.update("""
                UPDATE orders
                SET partner_id = ?, status = 'PROCESSING'
                WHERE id = ? AND status = 'PENDING' AND partner_id IS NULL AND design_request_id IS NULL
                  AND (payment_method = 'CASH' OR (payment_method = 'BANK_TRANSFER' AND payment_status = 'PAID'))
                """, partner.getId(), orderId);
        if (updated == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn đã có Đối tác khác nhận.");
        }

        Long customerId = ((Number) order.get("customer_id")).longValue();
        String orderCode = (String) order.get("order_code");
        logService.write(partner, "ORDER_ACCEPT", "orders", orderId, "Nhận đơn " + orderCode + ".");
        notificationService.notify(customerId, "ORDER_ACCEPTED", "Đơn hàng đã được tiếp nhận",
                "Đối tác " + partner.getFullName() + " đã nhận đơn " + orderCode + " và bắt đầu chuẩn bị hoa.",
                "account/orders.html");
    }

    @Transactional
    public void start(User partner, Long orderId) {
        Map<String, Object> order = findOrderForUpdate(orderId);
        if (!partner.getId().equals(nullableNumber(order.get("partner_id")))
                || order.get("design_request_id") == null
                || !"PENDING".equals(order.get("status"))
                || !"PAID".equals(order.get("payment_status"))) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Đơn thiết kế riêng chưa được thanh toán, không thuộc bạn hoặc không còn chờ bắt đầu.");
        }

        int updated = jdbc.update("""
                UPDATE orders
                SET status = 'PROCESSING'
                WHERE id = ? AND partner_id = ? AND design_request_id IS NOT NULL
                  AND status = 'PENDING' AND payment_status = 'PAID'
                """, orderId, partner.getId());
        if (updated == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn không còn ở trạng thái chờ bắt đầu.");
        }

        String orderCode = (String) order.get("order_code");
        Long customerId = ((Number) order.get("customer_id")).longValue();
        logService.write(partner, "ORDER_START", "orders", orderId, "Bắt đầu thực hiện đơn " + orderCode + ".");
        notificationService.notify(customerId, "ORDER_PROCESSING", "Đối tác bắt đầu thực hiện đơn hàng",
                "Đối tác " + partner.getFullName() + " đã bắt đầu thực hiện đơn " + orderCode + ".",
                "account/orders.html");
    }

    @Transactional
    public void ship(User partner, Long orderId, String completionImageUrl) {
        String fileName = completionImageUrl.substring("/uploads/".length());
        if (!Files.isRegularFile(uploadDir.resolve(fileName).normalize())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không tìm thấy ảnh hoàn thành đã tải lên.");
        }
        Map<String, Object> order = findOrderForUpdate(orderId);
        if (!partner.getId().equals(nullableNumber(order.get("partner_id")))
                || !"PROCESSING".equals(order.get("status"))) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn không thuộc bạn hoặc không ở trạng thái đang chuẩn bị.");
        }

        int updated = jdbc.update("""
                UPDATE orders
                SET completion_image_url = ?, status = 'SHIPPING', shipped_at = CURRENT_TIMESTAMP
                WHERE id = ? AND partner_id = ? AND status = 'PROCESSING'
                """, completionImageUrl, orderId, partner.getId());
        if (updated == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn không còn ở trạng thái đang chuẩn bị.");
        }

        String orderCode = (String) order.get("order_code");
        Long customerId = ((Number) order.get("customer_id")).longValue();
        logService.write(partner, "ORDER_SHIP", "orders", orderId,
                "Bàn giao đơn " + orderCode + " kèm ảnh hoa hoàn thành.");
        notificationService.notify(customerId, "ORDER_SHIPPED", "Đơn hàng đang được giao",
                "Đơn " + orderCode + " đã hoàn thành và được bàn giao cho đơn vị vận chuyển.",
                "account/orders.html");
    }

    private Map<String, Object> findOrderForUpdate(Long orderId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT customer_id, order_code, partner_id, design_request_id, status, payment_status
                FROM orders
                WHERE id = ?
                FOR UPDATE
                """, orderId);
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }
        return rows.get(0);
    }

    private static Long nullableNumber(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    private List<PartnerOrderView> queryOrders(String source, String condition, Object... parameters) {
        String sql = """
                SELECT o.id, o.order_code, o.customer_id, u.full_name AS customer_name,
                       u.phone AS customer_phone, o.partner_id, o.design_request_id, o.status,
                       o.payment_method, o.payment_status, o.total_amount, o.created_at,
                       o.shipped_at, o.completion_image_url, oi.item_name, oi.material,
                       oi.quantity, p.thumbnail_url
                FROM %s
                JOIN users u ON u.id = o.customer_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE %s
                ORDER BY o.created_at DESC, o.id DESC, oi.id
                """.formatted(source, condition);
        Map<Long, OrderBuilder> orders = new LinkedHashMap<>();
        jdbc.query(sql, rs -> {
            Long id = rs.getLong("id");
            OrderBuilder builder = orders.computeIfAbsent(id, ignored -> orderBuilder(rs));
            String itemName = rs.getString("item_name");
            if (itemName != null) {
                builder.items.add(new PartnerOrderItem(
                        itemName, rs.getString("material"), rs.getLong("quantity"), rs.getString("thumbnail_url")));
            }
        }, parameters);
        return orders.values().stream().map(OrderBuilder::build).toList();
    }

    private static OrderBuilder orderBuilder(ResultSet rs) {
        try {
            return new OrderBuilder(
                    rs.getLong("id"),
                    rs.getString("order_code"),
                    rs.getLong("customer_id"),
                    rs.getString("customer_name"),
                    rs.getString("customer_phone"),
                    nullableLong(rs, "partner_id"),
                    nullableLong(rs, "design_request_id"),
                    rs.getString("status"),
                    rs.getString("payment_method"),
                    rs.getString("payment_status"),
                    rs.getBigDecimal("total_amount"),
                    rs.getTimestamp("created_at").toLocalDateTime(),
                    rs.getTimestamp("shipped_at") == null ? null : rs.getTimestamp("shipped_at").toLocalDateTime(),
                    rs.getString("completion_image_url"));
        } catch (SQLException e) {
            throw new IllegalStateException("Không đọc được dữ liệu đơn hàng.", e);
        }
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static boolean isAvailablePayment(Object method, Object paymentStatus) {
        return "CASH".equals(method)
                || ("BANK_TRANSFER".equals(method) && "PAID".equals(paymentStatus));
    }

    private static final class OrderBuilder {
        private final Long id;
        private final String orderCode;
        private final Long customerId;
        private final String customerName;
        private final String customerPhone;
        private final Long partnerId;
        private final Long designRequestId;
        private final String status;
        private final String paymentMethod;
        private final String paymentStatus;
        private final java.math.BigDecimal totalAmount;
        private final java.time.LocalDateTime createdAt;
        private final java.time.LocalDateTime shippedAt;
        private final String completionImageUrl;
        private final List<PartnerOrderItem> items = new ArrayList<>();

        private OrderBuilder(Long id, String orderCode, Long customerId, String customerName, String customerPhone,
                             Long partnerId, Long designRequestId, String status, String paymentMethod,
                             String paymentStatus, java.math.BigDecimal totalAmount,
                             java.time.LocalDateTime createdAt, java.time.LocalDateTime shippedAt,
                             String completionImageUrl) {
            this.id = id;
            this.orderCode = orderCode;
            this.customerId = customerId;
            this.customerName = customerName;
            this.customerPhone = customerPhone;
            this.partnerId = partnerId;
            this.designRequestId = designRequestId;
            this.status = status;
            this.paymentMethod = paymentMethod;
            this.paymentStatus = paymentStatus;
            this.totalAmount = totalAmount;
            this.createdAt = createdAt;
            this.shippedAt = shippedAt;
            this.completionImageUrl = completionImageUrl;
        }

        private PartnerOrderView build() {
            return new PartnerOrderView(id, orderCode, customerId, customerName, customerPhone, partnerId,
                    designRequestId, status, paymentMethod, paymentStatus, totalAmount, createdAt,
                    shippedAt, completionImageUrl, List.copyOf(items));
        }
    }
}
