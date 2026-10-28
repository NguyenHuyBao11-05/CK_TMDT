package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RequestDetail(
        Long id,
        String title,
        String occasion,
        String materialPreference,
        String colorPreference,
        BigDecimal budget,
        Integer quantity,
        String description,
        String referenceImageUrl,
        LocalDateTime desiredDate,
        String status,
        LocalDateTime createdAt,
        Long selectedQuoteId,
        String orderStatus,
        String hiddenReason,
        List<QuoteItem> quotes
) {
}
