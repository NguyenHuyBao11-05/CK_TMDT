package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.AdminOrderStats;
import com.flower.server.dto.AdminRevenueStats;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class AdminStatsService {

    private final JdbcTemplate jdbc;

    public AdminStatsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public AdminOrderStats orders(LocalDate from, LocalDate to, Long partnerId) {
        validateRange(from, to);
        StringBuilder where = new StringBuilder("o.status <> 'DRAFT' AND o.created_at >= ? AND o.created_at < ?");
        if (partnerId != null) {
            where.append(" AND o.partner_id = ?");
        }
        Object[] parameters = orderParameters(from, to, partnerId);

        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM orders o WHERE " + where, Long.class, parameters);
        List<AdminOrderStats.StatusCount> statuses = jdbc.query("""
                        SELECT o.status, COUNT(*) AS total
                        FROM orders o
                        WHERE %s
                        GROUP BY o.status
                        ORDER BY FIELD(o.status, 'PENDING', 'PROCESSING', 'SHIPPING', 'RECEIVED', 'CANCELLED')
                        """.formatted(where),
                (rs, row) -> new AdminOrderStats.StatusCount(rs.getString("status"), rs.getLong("total")),
                parameters);
        List<AdminOrderStats.DailyOrderCount> daily = jdbc.query("""
                        SELECT DATE(o.created_at) AS day, COUNT(*) AS total
                        FROM orders o
                        WHERE %s
                        GROUP BY DATE(o.created_at)
                        ORDER BY day
                        """.formatted(where),
                (rs, row) -> new AdminOrderStats.DailyOrderCount(rs.getDate("day").toLocalDate(), rs.getLong("total")),
                parameters);
        List<AdminOrderStats.PartnerOrderCount> byPartner = jdbc.query("""
                        SELECT o.partner_id, COALESCE(u.full_name, 'Chưa có Đối tác nhận') AS partner_name,
                               COUNT(*) AS total,
                               SUM(o.status IN ('PROCESSING', 'SHIPPING')) AS processing,
                               SUM(o.status = 'RECEIVED') AS received,
                               SUM(o.status = 'CANCELLED') AS cancelled
                        FROM orders o
                        LEFT JOIN users u ON u.id = o.partner_id
                        WHERE %s
                        GROUP BY o.partner_id, u.full_name
                        ORDER BY total DESC, partner_name
                        """.formatted(where),
                (rs, row) -> new AdminOrderStats.PartnerOrderCount(
                        nullableLong(rs.getObject("partner_id")), rs.getString("partner_name"),
                        rs.getLong("total"), rs.getLong("processing"),
                        rs.getLong("received"), rs.getLong("cancelled")),
                parameters);
        List<AdminOrderStats.PartnerOption> partners = jdbc.query("""
                        SELECT id, full_name
                        FROM users
                        WHERE role = 'PARTNER'
                        ORDER BY full_name
                        """,
                (rs, row) -> new AdminOrderStats.PartnerOption(rs.getLong("id"), rs.getString("full_name")));

        return new AdminOrderStats(total == null ? 0 : total, statuses, daily, byPartner, partners);
    }

    @Transactional(readOnly = true)
    public AdminRevenueStats revenue(LocalDate from, LocalDate to) {
        validateRange(from, to);
        Object[] parameters = {from, to.plusDays(1)};
        String where = "o.status = 'RECEIVED' AND o.received_at >= ? AND o.received_at < ?";
        List<AdminRevenueStats.DailyRevenue> daily = jdbc.query("""
                        SELECT DATE(o.received_at) AS day, SUM(o.total_amount) AS revenue
                        FROM orders o
                        WHERE %s
                        GROUP BY DATE(o.received_at)
                        ORDER BY day
                        """.formatted(where),
                (rs, row) -> new AdminRevenueStats.DailyRevenue(
                        rs.getDate("day").toLocalDate(), rs.getBigDecimal("revenue")), parameters);
        List<AdminRevenueStats.PartnerRevenue> byPartner = jdbc.query("""
                        SELECT o.partner_id, COALESCE(u.full_name, 'Chưa có Đối tác nhận') AS partner_name,
                               COUNT(*) AS total, SUM(o.total_amount) AS revenue
                        FROM orders o
                        LEFT JOIN users u ON u.id = o.partner_id
                        WHERE %s
                        GROUP BY o.partner_id, u.full_name
                        ORDER BY revenue DESC, partner_name
                        """.formatted(where),
                (rs, row) -> new AdminRevenueStats.PartnerRevenue(
                        nullableLong(rs.getObject("partner_id")), rs.getString("partner_name"),
                        rs.getLong("total"), rs.getBigDecimal("revenue")), parameters);
        BigDecimal total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE " + where,
                BigDecimal.class, parameters);
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orders o WHERE " + where, Long.class, parameters);
        long orderCount = count == null ? 0 : count;
        BigDecimal average = orderCount == 0 ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(orderCount), 0, java.math.RoundingMode.HALF_UP);
        return new AdminRevenueStats(total == null ? BigDecimal.ZERO : total,
                orderCount, average, daily, byPartner);
    }

    private static Object[] orderParameters(LocalDate from, LocalDate to, Long partnerId) {
        return partnerId == null
                ? new Object[]{from, to.plusDays(1)}
                : new Object[]{from, to.plusDays(1), partnerId};
    }

    private static void validateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Khoảng ngày thống kê không hợp lệ.");
        }
    }

    private static Long nullableLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }
}
