package com.flower.server.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class OrderExpiryJob {

    private static final long PAYMENT_GRACE_MINUTES = 5;

    private final JdbcTemplate jdbc;
    private final LogService logService;
    private final NotificationService notificationService;
    private final long claimMinutes;
    private final long paymentMinutes;

    public OrderExpiryJob(JdbcTemplate jdbc, LogService logService, NotificationService notificationService,
                          @Value("${app.order-claim-minutes}") long claimMinutes,
                          @Value("${app.order-payment-minutes}") long paymentMinutes) {
        this.jdbc = jdbc;
        this.logService = logService;
        this.notificationService = notificationService;
        this.claimMinutes = claimMinutes;
        this.paymentMinutes = paymentMinutes;
    }

    @Scheduled(fixedDelayString = "${app.order-expire-check-ms}", initialDelay = 15000)
    @Transactional
    public void cancelExpiredOrders() {
        cancelUnclaimed();
        cancelUnpaid();
    }

    private void cancelUnclaimed() {
        List<Map<String, Object>> orders = jdbc.queryForList("""
                SELECT id, order_code, customer_id
                FROM orders
                WHERE status = 'PENDING' AND partner_id IS NULL AND design_request_id IS NULL
                  AND payment_method IS NOT NULL AND payment_status <> 'PAID'
                  AND created_at < NOW() - INTERVAL ? MINUTE
                """, claimMinutes);
        String reason = "Quá " + duration(claimMinutes) + " chưa có Đối tác nhận đơn.";
        for (Map<String, Object> order : orders) {
            long orderId = ((Number) order.get("id")).longValue();
            int updated = jdbc.update("""
                    UPDATE orders SET status = 'CANCELLED', cancel_reason = ?
                    WHERE id = ? AND status = 'PENDING' AND partner_id IS NULL AND payment_status <> 'PAID'
                    """, reason, orderId);
            if (updated == 0) {
                continue;
            }
            jdbc.update("UPDATE payments SET status = 'FAILED' WHERE order_id = ? AND status = 'PENDING'", orderId);
            String code = (String) order.get("order_code");
            notificationService.notify(((Number) order.get("customer_id")).longValue(), "ORDER_CANCELLED",
                    "Đơn hàng đã tự huỷ",
                    "Đơn " + code + " đã quá " + duration(claimMinutes) + " mà chưa có Đối tác nhận nên hệ thống tự huỷ. Bạn chưa bị trừ tiền.",
                    "shop/payment-success.html?code=" + code);
            logService.write(null, "ORDER_EXPIRE", "orders", orderId, "Tự huỷ đơn " + code + ": " + reason);
        }
    }

    private void cancelUnpaid() {
        List<Map<String, Object>> orders = jdbc.queryForList("""
                SELECT id, order_code, customer_id, partner_id
                FROM orders
                WHERE status = 'PENDING' AND partner_id IS NOT NULL AND design_request_id IS NULL
                  AND payment_method = 'BANK_TRANSFER' AND payment_status <> 'PAID'
                  AND accepted_at < NOW() - INTERVAL ? MINUTE
                """, paymentMinutes + PAYMENT_GRACE_MINUTES);
        String reason = "Quá " + duration(paymentMinutes) + " khách chưa thanh toán sau khi Đối tác nhận đơn.";
        for (Map<String, Object> order : orders) {
            long orderId = ((Number) order.get("id")).longValue();
            int updated = jdbc.update("""
                    UPDATE orders SET status = 'CANCELLED', cancel_reason = ?
                    WHERE id = ? AND status = 'PENDING' AND payment_status <> 'PAID'
                    """, reason, orderId);
            if (updated == 0) {
                continue;
            }
            jdbc.update("UPDATE payments SET status = 'FAILED' WHERE order_id = ? AND status = 'PENDING'", orderId);
            String code = (String) order.get("order_code");
            notificationService.notify(((Number) order.get("customer_id")).longValue(), "ORDER_CANCELLED",
                    "Đơn hàng đã tự huỷ",
                    "Đơn " + code + " đã quá hạn thanh toán " + duration(paymentMinutes) + " nên hệ thống tự huỷ.",
                    "shop/payment-success.html?code=" + code);
            notificationService.notify(((Number) order.get("partner_id")).longValue(), "ORDER_CANCELLED",
                    "Đơn hàng đã tự huỷ",
                    "Khách chưa thanh toán đơn " + code + " trong " + duration(paymentMinutes) + " nên đơn đã tự huỷ. Bạn không cần chuẩn bị đơn này.",
                    "partner/orders.html");
            logService.write(null, "ORDER_EXPIRE", "orders", orderId, "Tự huỷ đơn " + code + ": " + reason);
        }
    }

    private static String duration(long minutes) {
        return minutes % 60 == 0 ? minutes / 60 + " giờ" : minutes + " phút";
    }
}
