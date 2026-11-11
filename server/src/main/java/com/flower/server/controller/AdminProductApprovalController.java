package com.flower.server.controller;

import com.flower.server.dto.ProductApprovalItem;
import com.flower.server.dto.HideForm;
import com.flower.server.dto.RejectProductForm;
import com.flower.server.entity.Role;
import com.flower.server.service.AdminProductApprovalService;
import com.flower.server.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/product-approvals")
public class AdminProductApprovalController {

    private final AdminProductApprovalService service;
    private final CurrentUserService currentUser;

    public AdminProductApprovalController(AdminProductApprovalService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<ProductApprovalItem> list() {
        currentUser.require(Role.MANAGER);
        return service.list();
    }

    @PostMapping("/{productId}/approve")
    public Map<String, String> approve(@PathVariable Long productId) {
        service.approve(currentUser.require(Role.MANAGER), productId);
        return Map.of("message", "Đã duyệt sản phẩm.");
    }

    @PostMapping("/{productId}/reject")
    public Map<String, String> reject(@PathVariable Long productId,
                                      @Valid @RequestBody RejectProductForm form) {
        service.reject(currentUser.require(Role.MANAGER), productId, form);
        return Map.of("message", "Đã từ chối sản phẩm.");
    }

    @PostMapping("/{productId}/hide")
    public Map<String, String> hide(@PathVariable Long productId, @Valid @RequestBody HideForm form) {
        service.hide(currentUser.require(Role.MANAGER), productId, form);
        return Map.of("message", "Đã ẩn sản phẩm.");
    }

    @PostMapping("/{productId}/show")
    public Map<String, String> show(@PathVariable Long productId) {
        service.show(currentUser.require(Role.MANAGER), productId);
        return Map.of("message", "Đã hiển thị lại sản phẩm.");
    }
}
