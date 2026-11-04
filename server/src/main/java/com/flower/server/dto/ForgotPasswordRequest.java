package com.flower.server.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
        @NotBlank(message = "Vui lòng nhập email.")
        @Email(message = "Email không đúng định dạng.")
        @Size(max = 254, message = "Email quá dài.")
        String email)
{ }