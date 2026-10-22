package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpRequest(
        @NotBlank(message = "Vui lòng nhập mã OTP.")
        @Pattern(regexp = "\\d{6}", message = "OTP phải gồm 6 chữ số.")
        String otp
) {
}
