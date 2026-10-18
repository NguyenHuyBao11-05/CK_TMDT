package com.flower.server.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DesignRequestForm(
        @NotBlank(message = "Vui lòng nhập tiêu đề yêu cầu.")
        @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự.")
        String title,

        @NotBlank(message = "Vui lòng chọn dịp sử dụng.")
        @Size(max = 100, message = "Dịp sử dụng tối đa 100 ký tự.")
        String occasion,

        @NotBlank(message = "Vui lòng chọn chất liệu.")
        @Size(max = 50, message = "Chất liệu tối đa 50 ký tự.")
        String materialPreference,

        @NotBlank(message = "Vui lòng chọn 1 tông màu.")
        @Size(max = 100, message = "Tông màu tối đa 100 ký tự.")
        String colorPreference,

        @NotNull(message = "Vui lòng nhập mức giá mong muốn.")
        @Min(value = 100000, message = "Mức giá mong muốn tối thiểu 100.000 đ.")
        BigDecimal budget,

        @NotNull(message = "Vui lòng nhập số lượng.")
        @Min(value = 1, message = "Số lượng tối thiểu là 1.")
        @Max(value = 100, message = "Số lượng tối đa là 100.")
        Integer quantity,

        @NotBlank(message = "Vui lòng mô tả yêu cầu.")
        @Size(min = 20, message = "Mô tả cần ít nhất 20 ký tự.")
        String description,

        @Size(max = 500, message = "Đường dẫn ảnh quá dài.")
        String referenceImageUrl,

        @NotNull(message = "Vui lòng chọn thời gian nhận hoa.")
        LocalDateTime desiredDate
) {
}
