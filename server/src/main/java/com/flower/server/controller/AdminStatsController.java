package com.flower.server.controller;

import com.flower.server.dto.AdminOrderStats;
import com.flower.server.dto.AdminRevenueStats;
import com.flower.server.entity.Role;
import com.flower.server.service.AdminStatsService;
import com.flower.server.service.CurrentUserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final CurrentUserService currentUser;
    private final AdminStatsService service;

    public AdminStatsController(CurrentUserService currentUser, AdminStatsService service) {
        this.currentUser = currentUser;
        this.service = service;
    }

    @GetMapping("/orders")
    public AdminOrderStats orders(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long partnerId) {
        currentUser.require(Role.ADMIN);
        return service.orders(from, to, partnerId);
    }

    @GetMapping("/revenue")
    public AdminRevenueStats revenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        currentUser.require(Role.MANAGER);
        return service.revenue(from, to);
    }
}
