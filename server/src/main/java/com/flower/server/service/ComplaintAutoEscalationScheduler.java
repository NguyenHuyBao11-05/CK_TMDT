package com.flower.server.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ComplaintAutoEscalationScheduler {
    private final JdbcTemplate jdbcTemplate;
    private final int escalateDays;

    public ComplaintAutoEscalationScheduler(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.escalateDays = 2;
    }

    @Scheduled(fixedRate = 3600000)
    public void escalateOverdueComplaints() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(escalateDays);
        String sql = """
                UPDATE complaints
                SET moderation_status = 'PENDING_REVIEW'
                WHERE moderation_status = 'PENDING_PARTNER'
                  AND created_at <= ?
                  AND (
                      partner_response IS NULL
                      OR TRIM(partner_response) = ''
                  )
                """;
        try {
            jdbcTemplate.update(sql, cutoff);
        } catch (Exception e) {
            System.err.println("Lỗi tự động chuyển khiếu nại quá hạn: " + e.getMessage());
        }
    }
}