package com.flower.server.controller;

import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/menu-counts")
public class AdminMenuController {

    private final JdbcTemplate jdbc;
    private final CurrentUserService currentUser;

    public AdminMenuController(JdbcTemplate jdbc, CurrentUserService currentUser) {
        this.jdbc = jdbc;
        this.currentUser = currentUser;
    }

    @GetMapping
    public Map<String, Long> counts() {
        currentUser.require(Role.ADMIN, Role.MANAGER);
        return Map.of(
                "partner_approvals", count("SELECT COUNT(*) FROM partner_profiles WHERE approval_status = 'PENDING'"),
                "product_approvals", count("SELECT COUNT(*) FROM products WHERE status = 'PENDING'"),
                "complaints", count("SELECT COUNT(*) FROM complaints WHERE moderation_status = 'PENDING_REVIEW'"));
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }
}
