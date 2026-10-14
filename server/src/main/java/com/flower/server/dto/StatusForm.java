package com.flower.server.dto;

import com.flower.server.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record StatusForm(
        @NotNull(message = "Vui lòng chọn trạng thái.")
        UserStatus status
) {
}
