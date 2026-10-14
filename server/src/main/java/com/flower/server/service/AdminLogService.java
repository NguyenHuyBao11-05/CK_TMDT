package com.flower.server.service;

import com.flower.server.dto.LogItem;
import com.flower.server.dto.LogPage;
import com.flower.server.entity.SystemLog;
import com.flower.server.entity.User;
import com.flower.server.repository.SystemLogRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminLogService {

    private final SystemLogRepository logs;

    public AdminLogService(SystemLogRepository logs) {
        this.logs = logs;
    }

    @Transactional(readOnly = true)
    public LogPage search(LocalDate from, LocalDate to, String group, String q, int page, int size) {
        Page<SystemLog> result = logs.findAll(
                filter(from, to, group, q, null),
                PageRequest.of(Math.max(page, 0), size, Sort.by(Sort.Direction.DESC, "createdAt", "id")));

        LocalDate today = LocalDate.now();
        long login = logs.count(filter(from, to, "auth", null, null));
        long all = logs.count(filter(from, to, null, null, null));
        LogPage.Stats stats = new LogPage.Stats(
                logs.count(filter(today, today, null, null, null)),
                login,
                all - login,
                logs.count(filter(from, to, null, null, true)));

        return new LogPage(
                result.getContent().stream().map(LogItem::from).toList(),
                result.getNumber(),
                result.getTotalPages(),
                result.getTotalElements(),
                stats);
    }

    private Specification<SystemLog> filter(LocalDate from, LocalDate to, String group, String q, Boolean warningOnly) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (from != null) {
                where.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                where.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            }
            if (group != null && LogService.GROUP_PREFIXES.containsKey(group)) {
                where.add(cb.or(LogService.GROUP_PREFIXES.get(group).stream()
                        .map(prefix -> cb.like(root.get("action"), prefix + "%"))
                        .toArray(Predicate[]::new)));
            }
            if (Boolean.TRUE.equals(warningOnly)) {
                where.add(root.get("action").in(LogService.WARNING_ACTIONS));
            }
            if (q != null && !q.isBlank()) {
                Join<SystemLog, User> actor = root.join("actor", JoinType.LEFT);
                String keyword = "%" + q.trim().toLowerCase() + "%";
                where.add(cb.or(
                        cb.like(cb.lower(actor.get("fullName")), keyword),
                        cb.like(cb.lower(actor.get("email")), keyword)));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }
}
