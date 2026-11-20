package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PartnerComplaintResponseRequest(
        @NotBlank(message = "Vui lòng chọn phương án xử lý")
        String responseType,

        @NotBlank(message = "Vui lòng nhập nội dung phản hồi")
        @Size(min = 20, max = 2000, message = "Nội dung phản hồi phải từ 20 đến 2000 ký tự")
        String content
) {
}
