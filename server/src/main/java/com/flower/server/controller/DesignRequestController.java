package com.flower.server.controller;

import com.flower.server.dto.DesignRequestForm;
import com.flower.server.dto.MyRequestItem;
import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.DesignRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/design-requests")
public class DesignRequestController {

    private final DesignRequestService service;
    private final CurrentUserService currentUser;

    public DesignRequestController(DesignRequestService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @PostMapping
    public Map<String, Long> create(@Valid @RequestBody DesignRequestForm form) {
        return Map.of("id", service.create(currentUser.require(Role.CUSTOMER), form));
    }

    @GetMapping("/mine")
    public List<MyRequestItem> mine() {
        return service.mine(currentUser.require(Role.CUSTOMER));
    }

    @PostMapping("/{id}/cancel")
    public Map<String, String> cancel(@PathVariable Long id) {
        service.cancel(currentUser.require(Role.CUSTOMER), id);
        return Map.of("message", "Đã huỷ yêu cầu.");
    }
}
