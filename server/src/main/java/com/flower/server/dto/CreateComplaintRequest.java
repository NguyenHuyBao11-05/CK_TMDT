package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateComplaintRequest(
        @NotNull(message = "Vui lòng chọn đơn hàng")
        Long orderId,

        @NotBlank(message = "Vui lòng nhập nội dung khiếu nại")
        @Size(min = 20, max = 2000, message = "Nội dung khiếu nại phải từ 20 đến 2000 ký tự")
        String description,

        @Size(max = 500, message = "Đường dẫn ảnh không hợp lệ")
        String evidenceImageUrl
) {
}
