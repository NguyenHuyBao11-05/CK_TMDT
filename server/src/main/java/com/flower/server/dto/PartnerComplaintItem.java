package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PartnerComplaintItem(
        Long id,
        Long orderId,
        String orderCode,
        String customerName,
        String description,
        String evidenceImageUrl,
        String partnerResponse,
        String moderationStatus,
        String moderationNote,
        LocalDateTime createdAt,
        LocalDateTime partnerRespondedAt,
        BigDecimal orderTotal,

        String productName,
        String productImage,
        Integer quantity
) {
}