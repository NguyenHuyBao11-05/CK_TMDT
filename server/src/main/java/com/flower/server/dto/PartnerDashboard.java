package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record PartnerDashboard(
        String partnerName,
        BigDecimal revenueLastSevenDays,
        List<DailyRevenue> dailyRevenue,
        Map<String, Long> ordersByStatus,
        long pendingProductCount,
        List<PartnerOrderView> ordersNeedingAction
) {
    public record DailyRevenue(LocalDate day, BigDecimal revenue) {
    }
}
