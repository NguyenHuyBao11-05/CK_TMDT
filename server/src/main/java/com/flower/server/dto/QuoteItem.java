package com.flower.server.dto;

import com.flower.server.entity.DesignQuote;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record QuoteItem(
        Long id,
        Long partnerId,
        String partnerName,
        BigDecimal price,
        Integer estimatedDays,
        String description,
        String sampleImageUrl,
        String status,
        LocalDateTime createdAt
) {
    public static QuoteItem from(DesignQuote quote) {
        return new QuoteItem(
                quote.getId(),
                quote.getPartner().getId(),
                quote.getPartner().getFullName(),
                quote.getPrice(),
                quote.getEstimatedDays(),
                quote.getDescription(),
                quote.getSampleImageUrl(),
                quote.getStatus().name(),
                quote.getCreatedAt());
    }
}
