package com.flower.server.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserOrderCancelResponse(
        @JsonProperty("order_id")
        Long orderId,

        String status,

        @JsonProperty("refund_message")
        String refundMessage,

        String message
) {}
