package com.flower.server.controller;

import com.flower.server.entity.Role;
import com.flower.server.service.AdminOrderService;
import com.flower.server.service.CurrentUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final CurrentUserService currentUser;
    private final AdminOrderService service;

    public AdminOrderController(CurrentUserService currentUser, AdminOrderService service) {
        this.currentUser = currentUser;
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        currentUser.require(Role.MANAGER);
        return service.list();
    }

    @PostMapping("/{orderId}/cancel-unclaimed")
    public Map<String, String> cancelUnclaimed(@PathVariable Long orderId) {
        service.cancelUnclaimed(currentUser.require(Role.MANAGER), orderId);
        return Map.of("message", "Đã huỷ đơn hàng chưa có Đối tác nhận.");
    }
}
