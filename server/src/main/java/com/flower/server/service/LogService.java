package com.flower.server.service;

import com.flower.server.entity.SystemLog;
import com.flower.server.entity.User;
import com.flower.server.repository.SystemLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class LogService {

    public static final Map<String, List<String>> GROUP_PREFIXES = Map.of(
            "auth", List.of("LOGIN", "LOGOUT"),
            "account", List.of("USER_", "PARTNER_"),
            "product", List.of("PRODUCT_"),
            "order", List.of("ORDER_", "PAYMENT_", "INVOICE_"),
            "design", List.of("REQUEST_", "QUOTE_"),
            "complaint", List.of("COMPLAINT_")
    );

    public static final Set<String> WARNING_ACTIONS = Set.of("LOGIN_FAILED", "COMPLAINT_CREATE");

    private final SystemLogRepository logs;

    public LogService(SystemLogRepository logs) {
        this.logs = logs;
    }

    public void write(User actor, String action, String targetTable, Long targetId, String detail) {
        SystemLog log = new SystemLog();
        log.setActor(actor);
        log.setAction(action);
        log.setTargetTable(targetTable);
        log.setTargetId(targetId);
        log.setDetail(detail);
        logs.save(log);
    }

    public static String groupOf(String action) {
        return GROUP_PREFIXES.entrySet().stream()
                .filter(e -> e.getValue().stream().anyMatch(action::startsWith))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("other");
    }
}
