package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank
    private String token;

    public String getToken() {
        return token;
    }
}