package com.flower.server.controller;

import com.flower.server.dto.CompletionImageForm;
import com.flower.server.dto.PartnerOrderView;
import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.PartnerOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner/orders")
public class PartnerOrderController {

    private final CurrentUserService currentUser;
    private final PartnerOrderService service;

    public PartnerOrderController(CurrentUserService currentUser, PartnerOrderService service) {
        this.currentUser = currentUser;
        this.service = service;
    }

    @GetMapping("/available")
    public List<PartnerOrderView> available() {
        return service.available(currentUser.require(Role.PARTNER));
    }

    @GetMapping
    public List<PartnerOrderView> mine(@RequestParam(required = false) String status) {
        return service.mine(currentUser.require(Role.PARTNER), status);
    }

    @PostMapping("/{orderId}/accept")
    public Map<String, String> accept(@PathVariable Long orderId) {
        service.accept(currentUser.require(Role.PARTNER), orderId);
        return Map.of("message", "Đã nhận đơn hàng.");
    }

    @PostMapping("/{orderId}/start")
    public Map<String, String> start(@PathVariable Long orderId) {
        service.start(currentUser.require(Role.PARTNER), orderId);
        return Map.of("message", "Đã bắt đầu thực hiện đơn hàng.");
    }

    @PostMapping("/{orderId}/proof")
    public Map<String, String> proof(@PathVariable Long orderId, @Valid @RequestBody CompletionImageForm form) {
        service.saveProof(currentUser.require(Role.PARTNER), orderId, form.completionImageUrl());
        return Map.of("message", "Đã lưu ảnh hoa hoàn thành.");
    }

    @PostMapping("/{orderId}/ship")
    public Map<String, String> ship(@PathVariable Long orderId) {
        service.ship(currentUser.require(Role.PARTNER), orderId);
        return Map.of("message", "Đã chuyển đơn hàng sang Đang giao.");
    }
}
