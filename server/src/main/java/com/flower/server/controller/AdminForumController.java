package com.flower.server.controller;

import com.flower.server.dto.HideForm;
import com.flower.server.entity.Role;
import com.flower.server.service.AdminForumService;
import com.flower.server.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/forum")
public class AdminForumController {

    private final AdminForumService service;
    private final CurrentUserService currentUser;

    public AdminForumController(AdminForumService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(required = false) String status,
                                    @RequestParam(required = false) String visibility,
                                    @RequestParam(required = false) String q,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        currentUser.require(Role.MANAGER);
        return service.list(status, visibility, q, Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id) {
        currentUser.require(Role.MANAGER);
        return service.detail(id);
    }

    @PostMapping("/{id}/hide")
    public Map<String, String> hideRequest(@PathVariable Long id, @Valid @RequestBody HideForm form) {
        service.hideRequest(currentUser.require(Role.MANAGER), id, form.reason());
        return Map.of("message", "Đã ẩn yêu cầu khỏi diễn đàn.");
    }

    @PostMapping("/{id}/unhide")
    public Map<String, String> unhideRequest(@PathVariable Long id) {
        service.unhideRequest(currentUser.require(Role.MANAGER), id);
        return Map.of("message", "Đã hiển thị lại yêu cầu.");
    }

    @PostMapping("/quotes/{quoteId}/hide")
    public Map<String, String> hideQuote(@PathVariable Long quoteId, @Valid @RequestBody HideForm form) {
        service.hideQuote(currentUser.require(Role.MANAGER), quoteId, form.reason());
        return Map.of("message", "Đã ẩn báo giá.");
    }

    @PostMapping("/quotes/{quoteId}/unhide")
    public Map<String, String> unhideQuote(@PathVariable Long quoteId) {
        service.unhideQuote(currentUser.require(Role.MANAGER), quoteId);
        return Map.of("message", "Đã hiển thị lại báo giá.");
    }
}
