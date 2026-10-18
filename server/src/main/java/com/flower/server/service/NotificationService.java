package com.flower.server.service;

import com.flower.server.entity.Notification;
import com.flower.server.repository.NotificationRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    public void notify(Long userId, String type, String title, String content, String link) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setLinkUrl(link);
        notifications.save(notification);
    }
}
