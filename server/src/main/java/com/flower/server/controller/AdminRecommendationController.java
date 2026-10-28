package com.flower.server.controller;

import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.RecommendationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/recommendations")
public class AdminRecommendationController {

    private final RecommendationService service;
    private final CurrentUserService currentUser;

    public AdminRecommendationController(RecommendationService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public Map<String, Object> dashboard() {
        currentUser.require(Role.ADMIN);
        return service.dashboard();
    }

    @PostMapping("/train")
    public Map<String, Object> train() {
        return service.train(currentUser.require(Role.ADMIN));
    }
}
