package com.flower.server.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "partner_profiles")
@Getter
@Setter
public class PartnerProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String portfolioUrl;

    @Enumerated(EnumType.STRING)
    private PartnerApprovalStatus approvalStatus = PartnerApprovalStatus.PENDING;

    private Long approvedBy;
    private LocalDateTime approvedAt;
    private String rejectReason;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
