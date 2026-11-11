package com.flower.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class Profile {
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String authProvider;
}
