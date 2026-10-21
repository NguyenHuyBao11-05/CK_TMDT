package com.flower.server.dto;

import com.flower.server.entity.Notification;

import java.time.LocalDateTime;

public record NotificationItem(
        Long id,
        String type,
        String title,
        String content,
        String linkUrl,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationItem from(Notification n) {
        return new NotificationItem(n.getId(), n.getType(), n.getTitle(), n.getContent(), n.getLinkUrl(), n.isRead(), n.getCreatedAt());
    }
}
