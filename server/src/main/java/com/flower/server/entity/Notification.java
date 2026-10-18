package com.flower.server.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String type;
    private String title;
    private String content;
    private String linkUrl;
    private boolean isRead;
    private LocalDateTime createdAt = LocalDateTime.now();
}
