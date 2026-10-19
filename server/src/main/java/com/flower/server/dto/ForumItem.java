package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ForumItem(
        Long id,
        String customerName,
        String title,
        String occasion,
        String materialPreference,
        String colorPreference,
        BigDecimal budget,
        Integer quantity,
        String description,
        String referenceImageUrl,
        LocalDateTime desiredDate,
        LocalDateTime createdAt,
        int quoteCount,
        boolean hasSelected,
        Long myQuoteId,
        String myQuoteStatus
) {
}
