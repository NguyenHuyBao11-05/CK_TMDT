package com.flower.server.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderCode;
    private Long customerId;
    private Long partnerId;
    private Long designRequestId;
    private Long voucherId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private OrderPaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private OrderPaymentStatus paymentStatus = OrderPaymentStatus.UNPAID;

    private String recipientName;
    private String recipientPhone;
    private String deliveryAddress;
    private String deliveryNote;
    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String cancelReason;
    private String completionImageUrl;
    private LocalDateTime shippedAt;
    private LocalDateTime receivedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public Order() {
    }
}

