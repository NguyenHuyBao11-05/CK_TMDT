package com.flower.server.dto;

import java.util.List;

public record UserPage(
        List<UserItem> items,
        int page,
        int totalPages,
        long totalItems,
        Stats stats
) {
    public record Stats(long total, long customer, long partner, long locked) {
    }
}
