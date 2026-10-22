package com.flower.server.controller;

import com.flower.server.dto.PartnerDashboard;
import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.PartnerDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/dashboard")
public class PartnerDashboardController {

    private final CurrentUserService currentUser;
    private final PartnerDashboardService service;

    public PartnerDashboardController(CurrentUserService currentUser, PartnerDashboardService service) {
        this.currentUser = currentUser;
        this.service = service;
    }

    @GetMapping
    public PartnerDashboard dashboard() {
        return service.dashboard(currentUser.require(Role.PARTNER));
    }
}
