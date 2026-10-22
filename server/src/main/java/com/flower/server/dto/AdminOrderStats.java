package com.flower.server.dto;

import java.time.LocalDate;
import java.util.List;

public record AdminOrderStats(
        long totalOrders,
        List<StatusCount> statusCounts,
        List<DailyOrderCount> dailyCounts,
        List<PartnerOrderCount> partnerCounts,
        List<PartnerOption> partners
) {
    public record StatusCount(String status, long count) {
    }

    public record DailyOrderCount(LocalDate day, long count) {
    }

    public record PartnerOrderCount(Long partnerId, String partnerName, long totalOrders,
                                    long processingOrders, long receivedOrders, long cancelledOrders) {
    }

    public record PartnerOption(Long id, String name) {
    }
}
