package com.flower.server.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OrderAutoReceiveScheduler {

    private final JdbcTemplate jdbcTemplate;
    private final UserOrderService orderService;

    private final int autoReceiveDays;

    private final int autoReceiveMinutes;

    public OrderAutoReceiveScheduler(JdbcTemplate jdbcTemplate, UserOrderService orderService) {
        this.jdbcTemplate = jdbcTemplate;
        this.orderService = orderService;
        this.autoReceiveDays = 3;
        this.autoReceiveMinutes = 0;
    }

    @Scheduled(fixedRate = 3600000)
    public void autoReceiveOrders() {
        LocalDateTime cutoff;
        if (autoReceiveMinutes > 0) {
            cutoff = LocalDateTime.now().minusMinutes(autoReceiveMinutes);
        } else {
            cutoff = LocalDateTime.now().minusDays(autoReceiveDays);
        }
        String sql = """
                SELECT id
                FROM orders
                WHERE status = 'SHIPPING'
                  AND shipped_at IS NOT NULL
                  AND shipped_at <= ?
                """;

        List<Long> orderIds = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong("id"), cutoff);
        for (Long orderId : orderIds) {
            try {
                orderService.autoReceiveOrder(orderId);
            } catch (Exception e) {
                System.err.println("Không thể tự động xác nhận đơn " + orderId + ": " + e.getMessage());
            }
        }
    }
}