package com.flower.server.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PartnerOrderView(
        Long id,
        String orderCode,
        Long customerId,
        String customerName,
        String customerPhone,
        Long partnerId,
        Long designRequestId,
        String status,
        String paymentMethod,
        String paymentStatus,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        LocalDateTime shippedAt,
        String completionImageUrl,
        List<PartnerOrderItem> items
) {
    public String itemSummary() {
        return items.stream()
                .map(item -> item.itemName() + " × " + item.quantity())
                .reduce((left, right) -> left + ", " + right)
                .orElse("Đơn hàng");
    }
}
