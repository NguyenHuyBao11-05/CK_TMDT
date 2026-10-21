package com.flower.server.controller;

import com.flower.server.dto.PartnerApplicationItem;
import com.flower.server.dto.RejectPartnerApplicationForm;
import com.flower.server.entity.Role;
import com.flower.server.service.AdminPartnerApprovalService;
import com.flower.server.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/partner-approvals")
public class AdminPartnerApprovalController {

    private final AdminPartnerApprovalService service;
    private final CurrentUserService currentUser;

    public AdminPartnerApprovalController(AdminPartnerApprovalService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<PartnerApplicationItem> list() {
        currentUser.require(Role.MANAGER);
        return service.list();
    }

    @PostMapping("/{userId}/approve")
    public Map<String, String> approve(@PathVariable Long userId) {
        service.approve(currentUser.require(Role.MANAGER), userId);
        return Map.of("message", "Đã phê duyệt hồ sơ Đối tác.");
    }

    @PostMapping("/{userId}/reject")
    public Map<String, String> reject(@PathVariable Long userId,
                                      @Valid @RequestBody RejectPartnerApplicationForm form) {
        service.reject(currentUser.require(Role.MANAGER), userId, form);
        return Map.of("message", "Đã từ chối hồ sơ Đối tác.");
    }
}
