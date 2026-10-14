package com.flower.server.dto;

import com.flower.server.entity.Role;
import com.flower.server.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserForm(
        @NotBlank(message = "Vui lòng nhập họ tên.")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
        String fullName,

        @NotBlank(message = "Vui lòng nhập email.")
        @Email(message = "Email không hợp lệ.")
        String email,

        @Pattern(regexp = "^$|0[0-9]{9}", message = "Số điện thoại gồm 10 số, bắt đầu bằng 0.")
        String phone,

        @NotNull(message = "Vui lòng chọn vai trò.")
        Role role,

        @NotNull(message = "Vui lòng chọn trạng thái.")
        UserStatus status,

        @Size(min = 6, message = "Mật khẩu ít nhất 6 ký tự.")
        String password
) {
}
