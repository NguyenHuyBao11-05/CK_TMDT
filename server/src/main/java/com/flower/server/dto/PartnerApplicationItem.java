package com.flower.server.dto;

import com.flower.server.entity.PartnerApprovalStatus;

import java.time.LocalDateTime;

public record PartnerApplicationItem(
        Long userId,
        String fullName,
        String email,
        String phone,
        String bio,
        String portfolioUrl,
        PartnerApprovalStatus approvalStatus,
        String rejectReason,
        LocalDateTime createdAt
) {
}
