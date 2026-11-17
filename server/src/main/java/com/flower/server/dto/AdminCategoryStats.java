package com.flower.server.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminCategoryStats(
        long totalQuantity,
        BigDecimal totalRevenue,
        List<CategoryShare> categories
) {
    public record CategoryShare(String category, long quantity, long orderCount, BigDecimal revenue) {
    }
}
