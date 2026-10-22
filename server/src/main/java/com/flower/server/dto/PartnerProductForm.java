package com.flower.server.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record PartnerProductForm(
        @NotBlank(message = "Vui lòng nhập tên sản phẩm.")
        @Size(max = 200, message = "Tên sản phẩm không được vượt quá 200 ký tự.")
        String name,

        @NotBlank(message = "Vui lòng chọn chất liệu.")
        @Pattern(regexp = "Hoa thật|Hoa nhung|Hoa giấy", message = "Chất liệu không hợp lệ.")
        String material,

        String description,

        @NotNull(message = "Vui lòng nhập giá bán.")
        @DecimalMin(value = "50000", message = "Giá bán tối thiểu là 50.000 đ.")
        @Digits(integer = 12, fraction = 0, message = "Giá bán không hợp lệ.")
        BigDecimal price,

        @Digits(integer = 12, fraction = 0, message = "Giá ưu đãi không hợp lệ.")
        BigDecimal discountPrice,

        @NotEmpty(message = "Sản phẩm cần có ít nhất 1 ảnh.")
        @Size(max = 5, message = "Mỗi sản phẩm có tối đa 5 ảnh.")
        List<@NotBlank(message = "Đường dẫn ảnh không hợp lệ.") String> imageUrls
) {
}
