package com.flower.server.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateReviewResponse(
        @JsonProperty("review_id") Long reviewId,
        @JsonProperty("order_id") Long orderId,
        String message
) {
}
