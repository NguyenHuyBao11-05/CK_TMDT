package com.flower.server.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class UserOrder {
    private Long id;
    private String orderCode;
    private LocalDateTime createdAt;
    private String status;
    private BigDecimal totalAmount;
    private List<String> itemNames;
}
