package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompletionImageForm(
        @NotBlank(message = "Vui lòng tải ảnh hoa hoàn thành.")
        @Size(max = 500, message = "Đường dẫn ảnh không hợp lệ.")
        @Pattern(regexp = "^/uploads/[A-Za-z0-9_-]+\\.(jpg|png)$",
                message = "Ảnh hoàn thành phải được tải lên hệ thống.")
        String completionImageUrl
) {
}
