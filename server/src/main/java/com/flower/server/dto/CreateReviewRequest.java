package com.flower.server.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotNull(message = "Vui lòng chọn số sao")
        Integer rating,

        @Size(max = 1000, message = "Nhận xét không được vượt quá 1000 ký tự")
        String comment,

        @JsonProperty("image_url")
        @Size(max = 500, message = "Đường dẫn ảnh quá dài")
        String imageUrl
) {
}
