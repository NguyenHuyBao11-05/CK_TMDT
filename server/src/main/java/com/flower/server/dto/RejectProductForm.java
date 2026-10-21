package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectProductForm(
        @NotBlank(message = "Vui lòng nhập lý do từ chối.")
        @Size(max = 500, message = "Lý do từ chối không được vượt quá 500 ký tự.")
        String reason
) {
}
