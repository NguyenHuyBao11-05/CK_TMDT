package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HideForm(
        @NotBlank(message = "Vui lòng nhập lý do ẩn.")
        @Size(max = 500, message = "Lý do ẩn không được vượt quá 500 ký tự.")
        String reason
) {
}
