package com.flower.server.dto;

import java.time.LocalDateTime;

public record MyComplaintItem(
        Long id,
        Long orderId,
        String orderCode,
        String description,
        String evidenceImageUrl,
        String partnerResponse,
        LocalDateTime partnerRespondedAt,
        String moderationStatus,
        String moderationNote,
        LocalDateTime moderatedAt,
        LocalDateTime createdAt
) {
}
