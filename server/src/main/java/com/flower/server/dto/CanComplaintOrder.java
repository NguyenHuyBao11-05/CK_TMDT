package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CanComplaintOrder(
        Long id,
        String orderCode,
        LocalDateTime createdAt,
        String status,
        BigDecimal totalAmount
) {
}
