package com.flower.server.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserDashboard {
    private Long totalOrders;
    private Long deliveringOrders;

    private List<UserOrder> recentOrders;
}
