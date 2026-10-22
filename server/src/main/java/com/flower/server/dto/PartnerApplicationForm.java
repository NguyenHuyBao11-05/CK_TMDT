package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PartnerApplicationForm(
        @NotBlank(message = "Vui lòng nhập phần giới thiệu thương hiệu.")
        String bio,

        @NotBlank(message = "Vui lòng nhập link portfolio.")
        @Size(max = 500, message = "Link portfolio không được vượt quá 500 ký tự.")
        @Pattern(regexp = "^https?://\\S+$", message = "Link portfolio phải bắt đầu bằng http:// hoặc https://.")
        String portfolioUrl
) {
}
