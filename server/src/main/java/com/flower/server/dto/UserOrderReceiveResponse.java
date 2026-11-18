package com.flower.server.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserOrderReceiveResponse(
        @JsonProperty("order_id")
        Long orderId,
        String status,
        String message
) {
}
