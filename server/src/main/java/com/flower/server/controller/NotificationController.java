package com.flower.server.controller;

import com.flower.server.common.ApiException;
import com.flower.server.dto.NotificationItem;
import com.flower.server.entity.Notification;
import com.flower.server.entity.User;
import com.flower.server.repository.NotificationRepository;
import com.flower.server.service.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notifications;
    private final CurrentUserService currentUser;

    public NotificationController(NotificationRepository notifications, CurrentUserService currentUser) {
        this.notifications = notifications;
        this.currentUser = currentUser;
    }

    @GetMapping
    public Map<String, Object> list() {
        User user = currentUser.get();
        return Map.of(
                "unread_count", notifications.countByUserIdAndIsReadFalse(user.getId()),
                "items", notifications.findTop20ByUserIdOrderByCreatedAtDescIdDesc(user.getId()).stream()
                        .map(NotificationItem::from)
                        .toList());
    }

    @PostMapping("/{id}/read")
    @Transactional
    public Map<String, String> markRead(@PathVariable Long id) {
        Notification notification = notifications.findByIdAndUserId(id, currentUser.get().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo."));
        notification.setRead(true);
        return Map.of("message", "Đã đánh dấu đã đọc.");
    }

    @PostMapping("/read-all")
    @Transactional
    public Map<String, String> markAllRead() {
        notifications.markAllRead(currentUser.get().getId());
        return Map.of("message", "Đã đánh dấu đọc tất cả.");
    }
}
