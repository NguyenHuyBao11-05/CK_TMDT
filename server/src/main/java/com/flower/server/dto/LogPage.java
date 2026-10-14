package com.flower.server.dto;

import java.util.List;

public record LogPage(
        List<LogItem> items,
        int page,
        int totalPages,
        long totalItems,
        Stats stats
) {
    public record Stats(long today, long login, long change, long warning) {
    }
}
