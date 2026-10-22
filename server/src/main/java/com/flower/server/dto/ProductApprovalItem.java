package com.flower.server.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductApprovalItem(
        Long id,
        Long partnerId,
        String partnerName,
        String name,
        String material,
        String description,
        BigDecimal price,
        BigDecimal discountPrice,
        String thumbnailUrl,
        List<String> imageUrls,
        String status,
        String rejectReason
) {
}
