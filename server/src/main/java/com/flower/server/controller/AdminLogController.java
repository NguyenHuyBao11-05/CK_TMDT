package com.flower.server.controller;

import com.flower.server.dto.LogPage;
import com.flower.server.entity.Role;
import com.flower.server.service.AdminLogService;
import com.flower.server.service.CurrentUserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/logs")
public class AdminLogController {

    private final AdminLogService service;
    private final CurrentUserService currentUser;

    public AdminLogController(AdminLogService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public LogPage list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String group,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        currentUser.require(Role.ADMIN);
        return service.search(from, to, group, q, page, Math.min(Math.max(size, 1), 100));
    }
}
