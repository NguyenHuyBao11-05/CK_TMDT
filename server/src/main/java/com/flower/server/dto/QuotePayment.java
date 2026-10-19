package com.flower.server.dto;

import java.math.BigDecimal;
import java.util.List;

public record QuotePayment(
        List<Line> lines,
        BigDecimal subtotal,
        String voucherCode,
        BigDecimal discount,
        BigDecimal total
) {
    public record Line(
            Long productId,
            Long quoteId,
            Long designRequestId,
            Long partnerId,
            String name,
            String itemDescription,
            String partnerName,
            String thumbnailUrl,
            BigDecimal unitPrice,
            int quantity
    ) {
    }
}
