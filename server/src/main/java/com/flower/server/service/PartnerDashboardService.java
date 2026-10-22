package com.flower.server.service;

import com.flower.server.dto.PartnerDashboard;
import com.flower.server.dto.PartnerOrderView;
import com.flower.server.entity.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class PartnerDashboardService {

    private static final List<String> STATUSES = List.of("PENDING", "PROCESSING", "SHIPPING", "RECEIVED", "CANCELLED");

    private final JdbcTemplate jdbc;
    private final PartnerOrderService orderService;

    public PartnerDashboardService(JdbcTemplate jdbc, PartnerOrderService orderService) {
        this.jdbc = jdbc;
        this.orderService = orderService;
    }

    @Transactional(readOnly = true)
    public PartnerDashboard dashboard(User partner) {
        Map<String, Long> counts = new java.util.LinkedHashMap<>();
        STATUSES.forEach(status -> counts.put(status, 0L));
        jdbc.query("SELECT status, COUNT(*) AS total FROM orders WHERE partner_id = ? GROUP BY status",
                (rs, row) -> Map.entry(rs.getString("status"), rs.getLong("total")), partner.getId())
                .forEach(entry -> counts.put(entry.getKey(), entry.getValue()));

        List<PartnerDashboard.DailyRevenue> daily = jdbc.query("""
                        SELECT DATE(received_at) AS day, SUM(total_amount) AS revenue
                        FROM orders
                        WHERE partner_id = ? AND status = 'RECEIVED'
                          AND received_at >= CURDATE() - INTERVAL 6 DAY
                          AND received_at < CURDATE() + INTERVAL 1 DAY
                        GROUP BY DATE(received_at)
                        ORDER BY day
                        """,
                (rs, row) -> new PartnerDashboard.DailyRevenue(
                        rs.getDate("day").toLocalDate(), rs.getBigDecimal("revenue")), partner.getId());
        BigDecimal revenue = jdbc.queryForObject("""
                        SELECT COALESCE(SUM(total_amount), 0)
                        FROM orders
                        WHERE partner_id = ? AND status = 'RECEIVED'
                          AND received_at >= CURDATE() - INTERVAL 6 DAY
                          AND received_at < CURDATE() + INTERVAL 1 DAY
                        """, BigDecimal.class, partner.getId());
        Long pendingProducts = jdbc.queryForObject(
                "SELECT COUNT(*) FROM products WHERE partner_id = ? AND status = 'PENDING'",
                Long.class, partner.getId());
        List<PartnerOrderView> actionOrders = orderService.mine(partner, null).stream()
                .filter(order -> "PENDING".equals(order.status()) || "PROCESSING".equals(order.status()))
                .limit(5)
                .toList();
        return new PartnerDashboard(partner.getFullName(), revenue == null ? BigDecimal.ZERO : revenue, daily,
                Map.copyOf(counts), pendingProducts == null ? 0 : pendingProducts, actionOrders);
    }
}
