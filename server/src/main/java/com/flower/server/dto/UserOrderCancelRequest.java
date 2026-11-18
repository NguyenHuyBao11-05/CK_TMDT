package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserOrderCancelRequest(
        @NotBlank(message = "Vui lòng nhập lý do huỷ đơn")
        @Size(max = 300, message = "Lý do huỷ không được vượt quá 300 ký tự")
        String reason
) {}
