package com.flower.server.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "design_requests")
@Getter
@Setter
public class DesignRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    private String title;
    private String occasion;
    private String materialPreference;
    private String colorPreference;
    private BigDecimal budget;
    private Integer quantity;
    private String description;
    private String referenceImageUrl;
    private LocalDateTime desiredDate;

    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.OPEN;

    private Long selectedQuoteId;

    private LocalDateTime createdAt = LocalDateTime.now();
}
