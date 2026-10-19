package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SentQuoteItem(
        Long id,
        Long requestId,
        String requestTitle,
        String customerName,
        String referenceImageUrl,
        BigDecimal budget,
        Integer quantity,
        LocalDateTime desiredDate,
        String requestStatus,
        BigDecimal price,
        Integer estimatedDays,
        String description,
        String sampleImageUrl,
        String status,
        String resultNote,
        LocalDateTime createdAt
) {
}
