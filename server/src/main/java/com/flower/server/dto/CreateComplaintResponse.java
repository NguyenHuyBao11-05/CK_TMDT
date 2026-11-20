package com.flower.server.dto;

public record CreateComplaintResponse(
        Long complaintId,
        Long orderId,
        String status,
        String message
) {
}