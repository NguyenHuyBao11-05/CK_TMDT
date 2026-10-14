package com.flower.server.dto;

import com.flower.server.entity.SystemLog;
import com.flower.server.entity.User;
import com.flower.server.service.LogService;

import java.time.LocalDateTime;

public record LogItem(
        Long id,
        LocalDateTime createdAt,
        String actorName,
        String actorEmail,
        String actorRole,
        String action,
        String group,
        String targetTable,
        Long targetId,
        String detail,
        boolean warning
) {
    public static LogItem from(SystemLog log) {
        User actor = log.getActor();
        return new LogItem(
                log.getId(),
                log.getCreatedAt(),
                actor == null ? null : actor.getFullName(),
                actor == null ? null : actor.getEmail(),
                actor == null ? "SYSTEM" : actor.getRole().name(),
                log.getAction(),
                LogService.groupOf(log.getAction()),
                log.getTargetTable(),
                log.getTargetId(),
                log.getDetail(),
                LogService.WARNING_ACTIONS.contains(log.getAction())
        );
    }
}
