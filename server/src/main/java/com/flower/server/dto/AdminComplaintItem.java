package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminComplaintItem(
        Long id,
        Long orderId,
        String orderCode,
        String customerName,
        String partnerName,
        String description,
        String evidenceImageUrl,
        String partnerResponse,
        String moderationStatus,
        String moderationNote,
        LocalDateTime createdAt,
        LocalDateTime partnerRespondedAt,
        BigDecimal orderTotal
) {
}