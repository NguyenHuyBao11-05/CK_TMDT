package com.flower.server.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDetail(
        Long id,
        String orderCode,
        LocalDateTime createdAt,
        String status,
        String paymentStatus,
        String paymentMethod,
        String recipientName,
        String recipientPhone,
        String deliveryAddress,
        String deliveryNote,
        BigDecimal subtotalAmount,
        BigDecimal shippingFee,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        LocalDateTime shippedAt,
        LocalDateTime receivedAt,
        List<OrderDetailItem> items,

        @JsonProperty("is_reviewed")
        boolean isReviewed
){

public record OrderDetailItem(
        Long id,
        String itemName,
        String itemDescription,
        String material,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal subtotal,
        String thumbnailUrl
) {
}
}
