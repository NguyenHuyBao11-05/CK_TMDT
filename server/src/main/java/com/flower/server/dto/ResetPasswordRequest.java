package com.flower.server.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank
        @Email
        String email,

        @NotBlank(message = "Vui lòng nhập mã OTP.")
        @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm 6 chữ số.")
        String otp,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới.")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự.")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Mật khẩu phải gồm chữ và số.")
        String password
) {
}

