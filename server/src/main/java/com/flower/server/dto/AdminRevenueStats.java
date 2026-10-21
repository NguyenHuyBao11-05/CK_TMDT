package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AdminRevenueStats(
        BigDecimal totalRevenue,
        long orderCount,
        BigDecimal averageOrderValue,
        List<DailyRevenue> dailyRevenue,
        List<PartnerRevenue> partnerRevenue
) {
    public record DailyRevenue(LocalDate day, BigDecimal revenue) {
    }

    public record PartnerRevenue(Long partnerId, String partnerName, long orderCount, BigDecimal revenue) {
    }
}
