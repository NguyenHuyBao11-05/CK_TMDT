package com.flower.server.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record QuoteForm(
        @NotNull(message = "Vui lòng nhập giá đề xuất.")
        @Min(value = 50000, message = "Giá đề xuất tối thiểu 50.000 đ.")
        BigDecimal price,

        @NotNull(message = "Vui lòng nhập số ngày hoàn thành.")
        @Min(value = 1, message = "Số ngày hoàn thành tối thiểu là 1.")
        @Max(value = 30, message = "Số ngày hoàn thành tối đa là 30.")
        Integer estimatedDays,

        @NotBlank(message = "Vui lòng mô tả cách làm.")
        @Size(min = 20, message = "Mô tả cách làm cần ít nhất 20 ký tự.")
        String description,

        @Size(max = 500, message = "Đường dẫn ảnh quá dài.")
        String sampleImageUrl
) {
}
