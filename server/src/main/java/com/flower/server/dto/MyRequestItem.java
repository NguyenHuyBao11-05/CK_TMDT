package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record MyRequestItem(
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
        int quoteCount,
        BigDecimal minPrice,
        List<String> partnerNames,
        Long selectedQuoteId,
        String selectedPartnerName,
        BigDecimal selectedPrice,
        String orderStatus,
        String hiddenReason
) {
}
