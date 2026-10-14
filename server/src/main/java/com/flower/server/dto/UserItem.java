package com.flower.server.dto;

import com.flower.server.entity.User;

import java.time.LocalDateTime;

public record UserItem(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        String authProvider,
        String status,
        LocalDateTime createdAt
) {
    public static UserItem from(User user) {
        return new UserItem(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name(),
                user.getAuthProvider().name(),
                user.getStatus().name(),
                user.getCreatedAt());
    }
}
