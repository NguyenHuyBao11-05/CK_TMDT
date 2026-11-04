package com.flower.server.controller;

import com.flower.server.dto.Profile;
import com.flower.server.dto.ProfileUpdateRequest;
import com.flower.server.dto.UserChangePasswordRequest;
import com.flower.server.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
@Validated
public class AccountController {
    private final AccountService accountService;

    @GetMapping("/profile")
    public Profile getProfile() {
        return accountService.getProfile();
    }

    @PutMapping("/update-profile")
    public Profile updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return accountService.updateProfile(request);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody UserChangePasswordRequest request) {
        accountService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
