package com.flower.server.controller;

import com.flower.server.dto.PartnerApplicationForm;
import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.PartnerApplicationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/partner")
public class PartnerApplicationController {

    private final CurrentUserService currentUser;
    private final PartnerApplicationService service;

    public PartnerApplicationController(CurrentUserService currentUser, PartnerApplicationService service) {
        this.currentUser = currentUser;
        this.service = service;
    }

    @PostMapping("/apply")
    public Map<String, String> apply(@Valid @RequestBody PartnerApplicationForm form) {
        service.apply(currentUser.require(Role.CUSTOMER), form);
        return Map.of("message", "Hồ sơ đăng ký Đối tác đã được gửi.");
    }
}
