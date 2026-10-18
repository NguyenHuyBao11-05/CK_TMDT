package com.flower.server.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "design_quotes")
@Getter
@Setter
public class DesignQuote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private DesignRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id")
    private User partner;

    private BigDecimal price;
    private Integer estimatedDays;
    private String description;
    private String sampleImageUrl;

    @Enumerated(EnumType.STRING)
    private QuoteStatus status = QuoteStatus.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();
}
