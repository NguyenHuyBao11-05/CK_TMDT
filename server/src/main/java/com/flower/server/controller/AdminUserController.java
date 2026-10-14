package com.flower.server.controller;

import com.flower.server.dto.StatusForm;
import com.flower.server.dto.UserForm;
import com.flower.server.dto.UserItem;
import com.flower.server.dto.UserPage;
import com.flower.server.entity.Role;
import com.flower.server.entity.UserStatus;
import com.flower.server.service.AdminUserService;
import com.flower.server.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService service;
    private final CurrentUserService currentUser;

    public AdminUserController(AdminUserService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public UserPage list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        currentUser.require(Role.ADMIN);
        return service.search(q, role, status, page, Math.min(Math.max(size, 1), 100));
    }

    @PostMapping
    public UserItem create(@Valid @RequestBody UserForm form) {
        return service.create(currentUser.require(Role.ADMIN), form);
    }

    @PutMapping("/{id}")
    public UserItem update(@PathVariable Long id, @Valid @RequestBody UserForm form) {
        return service.update(currentUser.require(Role.ADMIN), id, form);
    }

    @PatchMapping("/{id}/status")
    public UserItem changeStatus(@PathVariable Long id, @Valid @RequestBody StatusForm form) {
        return service.changeStatus(currentUser.require(Role.ADMIN), id, form.status());
    }

    @PostMapping("/{id}/reset-password")
    public Map<String, String> resetPassword(@PathVariable Long id) {
        return Map.of("temporary_password", service.resetPassword(currentUser.require(Role.ADMIN), id));
    }
}
