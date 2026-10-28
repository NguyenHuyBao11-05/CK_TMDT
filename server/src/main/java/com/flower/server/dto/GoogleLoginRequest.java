package com.flower.server.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank(message = "Thiếu token google")
    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}