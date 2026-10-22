package com.flower.server.controller;

import com.flower.server.dto.PartnerProductForm;
import com.flower.server.dto.ProductApprovalItem;
import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.PartnerProductService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner/products")
public class PartnerProductController {

    private final CurrentUserService currentUser;
    private final PartnerProductService service;

    public PartnerProductController(CurrentUserService currentUser, PartnerProductService service) {
        this.currentUser = currentUser;
        this.service = service;
    }

    @GetMapping
    public List<ProductApprovalItem> mine() {
        return service.mine(currentUser.require(Role.PARTNER));
    }

    @PostMapping
    public Map<String, Long> create(@Valid @RequestBody PartnerProductForm form) {
        return Map.of("id", service.create(currentUser.require(Role.PARTNER), form));
    }

    @PutMapping("/{productId}")
    public Map<String, String> update(@PathVariable Long productId, @Valid @RequestBody PartnerProductForm form) {
        service.update(currentUser.require(Role.PARTNER), productId, form);
        return Map.of("message", "Đã cập nhật sản phẩm.");
    }
}
