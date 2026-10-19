package com.flower.server.dto;

import jakarta.validation.constraints.NotNull;

public record SelectQuoteForm(
        @NotNull(message = "Vui lòng chọn 1 báo giá.")
        Long quoteId
) {
}
