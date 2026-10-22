package com.flower.server.dto;

public record PartnerOrderItem(
        String itemName,
        String material,
        Long quantity,
        String thumbnailUrl
) {
}
