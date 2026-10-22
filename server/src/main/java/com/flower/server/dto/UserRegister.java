package com.flower.server.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserRegister(
        @NotBlank(message = "Vui lòng nhập họ tên.")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
        String username,

        @NotBlank(message = "Vui lòng nhập email.")
        @Email(message = "Email không hợp lệ.")
        @Size(max = 255, message = "Email quá dài.")
        String email,

        @Pattern(regexp = "^$|0[0-9]{9}", message = "Số điện thoại gồm 10 số, bắt đầu bằng 0.")
        String phone,

        @NotBlank(message = "Vui lòng nhập mật khẩu.")
        @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự.")
        String password
) {
}