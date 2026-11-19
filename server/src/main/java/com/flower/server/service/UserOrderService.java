package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.*;
import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserOrderService {
    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUser;
    private final LogService logService;
    private final NotificationService notificationService;

    public UserOrderService(JdbcTemplate jdbcTemplate, CurrentUserService currentUser, LogService logService, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    public List<UserOrderItem> getMyOrders(String status) {
        User user = currentUser.require(Role.CUSTOMER);
        StringBuilder sql = new StringBuilder("""
                SELECT
                    o.id,
                    o.order_code,
                    o.created_at,
                    o.status,
                    o.payment_status,
                    o.payment_method,
                    o.total_amount,
                    (o.status = 'PENDING' AND o.payment_method = 'BANK_TRANSFER' AND o.payment_status <> 'PAID'
                        AND o.design_request_id IS NULL AND o.accepted_at IS NOT NULL) AS can_pay
                FROM orders o
                WHERE o.customer_id = ?
                """);

        List<Object> params = new ArrayList<>();
        params.add(user.getId());

        if (status != null && !status.isBlank()) {
            sql.append(" AND o.status = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append(" ORDER BY o.created_at DESC");
        List<OrderRow> rows = jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> new OrderRow(
                        rs.getLong("id"),
                        rs.getString("order_code"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getString("status"),
                        rs.getString("payment_status"),
                        rs.getString("payment_method"),
                        rs.getBigDecimal("total_amount"),
                        rs.getBoolean("can_pay")
                ), params.toArray()
        );

        if (rows.isEmpty()) {
            return List.of();
        }


        List<Long> orderIds = rows.stream().map(OrderRow::id).toList();

        String placeholders = String.join(",", Collections.nCopies(orderIds.size(), "?"));

        String itemSql = """
                SELECT
                    oi.order_id,
                    oi.item_name,
                    p.thumbnail_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id IN (%s)
                ORDER BY oi.id
                """.formatted(placeholders);

        Map<Long, List<String>> itemsByOrder = new HashMap<>();
        Map<Long, String> imagesByOrder = new HashMap<>();
        jdbcTemplate.query(
                itemSql, rs -> {
                    Long orderId = rs.getLong("order_id");
                    String itemName = rs.getString("item_name");
                    String thumbnailUrl = rs.getString("thumbnail_url");
                    itemsByOrder.computeIfAbsent(orderId, k -> new ArrayList<>()).add(itemName);
                    if (!imagesByOrder.containsKey(orderId) && thumbnailUrl != null && !thumbnailUrl.isBlank()) {
                        imagesByOrder.put(orderId, thumbnailUrl);
                    }
                }, orderIds.toArray()
        );

        return rows.stream().map(order -> {
            return new UserOrderItem(
                    order.id(),
                    order.orderCode(),
                    order.createdAt(),
                    order.status(),
                    order.paymentStatus(),
                    order.paymentMethod(),
                    order.totalAmount(),
                    itemsByOrder.getOrDefault(order.id(), List.of()),
                    imagesByOrder.get(order.id()),
                    order.canPay()
            );
        }).toList();
    }

    public OrderDetail getOrderDetail(Long orderId) {
        User user = currentUser.require(Role.CUSTOMER);
        String sql = """
                SELECT
                    id, order_code, created_at, status,
                    payment_status, payment_method,
                    recipient_name, recipient_phone,
                    delivery_address, delivery_note,
                    subtotal_amount, shipping_fee,
                    discount_amount, total_amount,
                    shipped_at, received_at,
                    EXISTS (
                        SELECT 1
                        FROM reviews r
                        WHERE r.order_id = orders.id
                    ) AS is_reviewed
                FROM orders
                WHERE id = ? AND customer_id = ?
                """;
        List<OrderDetail> result = jdbcTemplate.query(sql, (rs, rowNum) -> new OrderDetail(
                rs.getLong("id"),
                rs.getString("order_code"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getString("status"),
                rs.getString("payment_status"),
                rs.getString("payment_method"),
                rs.getString("recipient_name"),
                rs.getString("recipient_phone"),
                rs.getString("delivery_address"),
                rs.getString("delivery_note"),
                rs.getBigDecimal("subtotal_amount"),
                rs.getBigDecimal("shipping_fee"),
                rs.getBigDecimal("discount_amount"),
                rs.getBigDecimal("total_amount"),
                rs.getTimestamp("shipped_at") == null ? null : rs.getTimestamp("shipped_at").toLocalDateTime(),
                rs.getTimestamp("received_at") == null ? null : rs.getTimestamp("received_at").toLocalDateTime(),
                List.of(),
                rs.getBoolean("is_reviewed")), orderId, user.getId()
        );

        if (result.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng");
        }
        OrderDetail order = result.getFirst();
        String itemSql = """
                SELECT
                    oi.id,
                    oi.item_name,
                    oi.item_description,
                    oi.material,
                    oi.unit_price,
                    oi.quantity,
                    oi.subtotal,
                    p.thumbnail_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
                ORDER BY oi.id
                """;

        List<OrderDetail.OrderDetailItem> items =
                jdbcTemplate.query(itemSql, (rs, rowNum) -> new OrderDetail.OrderDetailItem(
                        rs.getLong("id"),
                        rs.getString("item_name"),
                        rs.getString("item_description"),
                        rs.getString("material"),
                        rs.getBigDecimal("unit_price"),
                        rs.getInt("quantity"),
                        rs.getBigDecimal("subtotal"),
                        rs.getString("thumbnail_url")), orderId
                );

        return new OrderDetail(
                order.id(),
                order.orderCode(),
                order.createdAt(),
                order.status(),
                order.paymentStatus(),
                order.paymentMethod(),
                order.recipientName(),
                order.recipientPhone(),
                order.deliveryAddress(),
                order.deliveryNote(),
                order.subtotalAmount(),
                order.shippingFee(),
                order.discountAmount(),
                order.totalAmount(),
                order.shippedAt(),
                order.receivedAt(),
                items,
                order.isReviewed()
        );
    }

    @Transactional
    public UserOrderCancelResponse cancelOrder(Long orderId, UserOrderCancelRequest request) {
        User user = currentUser.require(Role.CUSTOMER);
        String reason = request.reason() == null ? "" : request.reason().trim();
        if (reason.isEmpty() || reason.length() > 300) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lý do huỷ phải có từ 1 đến 300 ký tự");
        }

        String orderSql = """
                SELECT id, order_code, status, payment_method, payment_status, partner_id
                FROM orders
                WHERE id = ? AND customer_id = ?
                FOR UPDATE
                """;
        List<OrderCancelInfo> orders = jdbcTemplate.query(orderSql, (rs, rowNum) -> new OrderCancelInfo(
                        rs.getLong("id"),
                        rs.getString("order_code"),
                        rs.getString("status"),
                        rs.getString("payment_method"),
                        rs.getString("payment_status"),
                        rs.getObject("partner_id", Long.class)
                ), orderId, user.getId()
        );
        if (orders.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng");
        }
        OrderCancelInfo order = orders.getFirst();
        if (!"PENDING".equals(order.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ có thể huỷ đơn hàng đang chờ xử lý");
        }
        if ("PAID".equals(order.paymentStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng đã thanh toán, vui lòng gửi khiếu nại để được hỗ trợ huỷ và hoàn tiền");
        }

        String updateSql = """
                UPDATE orders
                SET status = 'CANCELLED',
                    cancel_reason = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND customer_id = ? AND status = 'PENDING'
                """;

        int updated = jdbcTemplate.update(updateSql, reason, orderId, user.getId());
        if (updated != 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn hàng đã được cập nhật, vui lòng tải lại");
        }
        jdbcTemplate.update("UPDATE payments SET status = 'FAILED' WHERE order_id = ? AND status = 'PENDING'", orderId);

        logService.write(user, "ORDER_CANCEL", "orders", orderId, "Khách hàng huỷ đơn hàng " + order.orderCode() + ".");
        if (order.partnerId() != null) {
            notificationService.notify(order.partnerId(), "ORDER_CANCEL",
                    "Đơn hàng đã bị huỷ", "Đơn hàng " + order.orderCode() + " đã được khách hàng huỷ. Lý do: " + reason,
                    "partner/orders.html");
        }

        return new UserOrderCancelResponse(orderId, "CANCELLED", null, "Huỷ đơn hàng thành công");
    }

    @Transactional
    public UserOrderReceiveResponse receivedOrder(Long orderId) {
        User customer = currentUser.require(Role.CUSTOMER);
        String selectSql = """
                SELECT id, status, payment_method
                FROM orders
                WHERE id = ? AND customer_id = ?
                FOR UPDATE
                """;
        List<OrderReceiveInfo> result = jdbcTemplate.query(selectSql, (rs, rowNum) -> new OrderReceiveInfo(
                rs.getLong("id"),
                rs.getString("status"),
                rs.getString("payment_method")), orderId, customer.getId()
        );
        if (result.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng");
        }
        OrderReceiveInfo order = result.getFirst();
        if (!"SHIPPING".equals(order.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ có thể xác nhận đơn hàng đang giao");
        }
        String updateSql = """
                UPDATE orders
                SET status = 'RECEIVED',
                    received_at = CURRENT_TIMESTAMP,
                    payment_status = CASE
                        WHEN payment_method = 'CASH' THEN 'PAID'
                        ELSE payment_status
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND customer_id = ?
                  AND status = 'SHIPPING'
                """;
        int updated = jdbcTemplate.update(updateSql, orderId, customer.getId());
        if (updated != 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn hàng đã được cập nhật, vui lòng tải lại");
        }
        logService.write(customer, "ORDER_RECEIVED", "users", customer.getId(), "Khách hàng xác nhận đã nhận đơn hàng.");
        return new UserOrderReceiveResponse(orderId, "RECEIVED", "Xác nhận đã nhận hàng thành công");
    }

    @Transactional
    public void autoReceiveOrder(Long orderId) {
        String selectSql = """
                SELECT id, customer_id, status
                FROM orders
                WHERE id = ?
                FOR UPDATE
                """;

        List<AutoReceiveInfo> result = jdbcTemplate.query(selectSql, (rs, rowNum) -> new AutoReceiveInfo(
                rs.getLong("id"),
                rs.getLong("customer_id"),
                rs.getString("status")), orderId
        );
        if (result.isEmpty()) {
            return;
        }
        AutoReceiveInfo order = result.getFirst();
        if (!"SHIPPING".equals(order.status())) {
            return;
        }

        String updateSql = """
                UPDATE orders
                SET status = 'RECEIVED',
                    received_at = CURRENT_TIMESTAMP,
                    payment_status = CASE
                        WHEN payment_method = 'CASH' THEN 'PAID'
                        ELSE payment_status
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND status = 'SHIPPING'
                """;
        int updated = jdbcTemplate.update(updateSql, orderId);
        if (updated != 1) {
            return;
        }

        logService.write(null, "ORDER_AUTO_RECEIVED", "orders", orderId, "Hệ thống tự động xác nhận khách hàng đã nhận đơn hàng.");
        notificationService.notify(order.customerId(), "ORDER_AUTO_RECEIVED", "Đơn hàng đã hoàn thành", "Đơn hàng #" + orderId + " đã được tự động xác nhận hoàn thành.", "account/order-detail.html?id=" + orderId);
    }

    @Transactional
    public CreateReviewResponse createReview(Long orderId, CreateReviewRequest request) {
        var customer = currentUser.require(Role.CUSTOMER);
        if (request.comment() != null && request.comment().length() > 1000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nhận xét không được vượt quá 1000 ký tự.");
        }
        String selectSql = """
                SELECT id, status, partner_id
                FROM orders
                WHERE id = ? AND customer_id = ?
                FOR UPDATE
                """;
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(selectSql, orderId, customer.getId());
        if (orders.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }
        Map<String, Object> order = orders.get(0);
        if (!"RECEIVED".equals(order.get("status"))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ đơn hàng đã nhận mới được đánh giá.");
        }
        Integer reviewed = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM reviews WHERE order_id = ?", Integer.class, orderId);
        if (reviewed != null && reviewed > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn hàng này đã được đánh giá.");
        }
        String productSql = """
                SELECT
                    COUNT(DISTINCT product_id) AS product_count,
                    MIN(product_id) AS product_id
                FROM order_items
                WHERE order_id = ?
                  AND product_id IS NOT NULL
                """;

        Map<String, Object> productInfo = jdbcTemplate.queryForMap(productSql, orderId);
        Long productId;
        Number productCount = (Number) productInfo.get("product_count");

        if (productCount != null && productCount.intValue() == 1) {
            productId = ((Number) productInfo.get("product_id")).longValue();
        } else {
            productId = null;
        }
        Long partnerId = order.get("partner_id") == null ? null : ((Number) order.get("partner_id")).longValue();
        String insertSql = """
                INSERT INTO reviews (
                    order_id,
                    customer_id,
                    product_id,
                    partner_id,
                    rating,
                    comment,
                    image_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, orderId);
            ps.setLong(2, customer.getId());
            if (productId == null) {
                ps.setNull(3, Types.BIGINT);
            } else {
                ps.setLong(3, productId);
            }
            if (partnerId == null) {
                ps.setNull(4, Types.BIGINT);
            } else {
                ps.setLong(4, partnerId);
            }
            ps.setInt(5, request.rating());
            ps.setString(6, request.comment());
            ps.setString(7, request.imageUrl());
            return ps;
        }, keyHolder);
        Long reviewId = Objects.requireNonNull(keyHolder.getKey()).longValue();
        logService.write(customer, "ORDER_REVIEW", "orders", orderId, "Khách hàng đánh giá đơn hàng.");
        return new CreateReviewResponse(reviewId, orderId, "Đánh giá đơn hàng thành công.");
    }

    private record AutoReceiveInfo(
            Long id,
            Long customerId,
            String status
    ) {
    }

    private record OrderReceiveInfo(
            Long id,
            String status,
            String paymentMethod
    ) {
    }

    private record OrderCancelInfo(
            Long id,
            String orderCode,
            String status,
            String paymentMethod,
            String paymentStatus,
            Long partnerId
    ) {
    }

    private record OrderRow(
            Long id,
            String orderCode,
            LocalDateTime createdAt,
            String status,
            String paymentStatus,
            String paymentMethod,
            BigDecimal totalAmount,
            boolean canPay
    ) {
    }
}
