package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UserOrderItem(
        Long id,
        String orderCode,
        LocalDateTime createdAt,
        String status,
        String paymentStatus,
        String paymentMethod,
        BigDecimal totalAmount,
        List<String> itemNames,
        String thumbnailUrl,
        boolean canContinuePayment
) {}

