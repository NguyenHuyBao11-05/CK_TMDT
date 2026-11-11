package com.flower.server.service;

import com.flower.server.dto.*;
import com.flower.server.entity.*;
import com.flower.server.repository.NotificationRepository;
import com.flower.server.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AccountService {
    private final JdbcTemplate jdbc;

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final LogService logService;


    private final PasswordEncoder passwordEncoder;

    public AccountService(JdbcTemplate jdbc, CurrentUserService currentUserService, UserRepository userRepository, LogService logService, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.logService = logService;
        this.passwordEncoder = passwordEncoder;
    }

    public Profile getProfile() {
        User user = currentUserService.get();
        return toProfileResponse(user);
    }

    @Transactional
    public Profile updateProfile(ProfileUpdateRequest request) {
        User user = currentUserService.get();
        user.setFullName(request.getUsername().trim());
        user.setPhone(request.getPhone());
        if (request.getAvatar() != null && !request.getAvatar().isBlank()) {
            user.setAvatarUrl(request.getAvatar());
        }
        userRepository.save(user);
        logService.write(user, "USER_UPDATE", "users", user.getId(), "Cập nhật tài khoản.");
        return toProfileResponse(user);
    }

    private Profile toProfileResponse(User user) {
        return new Profile(user.getFullName(), user.getEmail(), user.getPhone(), user.getAvatarUrl(), user.getAuthProvider().name());
    }

    public void changePassword(@Valid UserChangePasswordRequest request) {
        User user = currentUserService.get();
        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản Google không hỗ trợ đổi mật khẩu.");
        }

        if (!passwordEncoder.matches(request.getCurrentpass(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác.");
        }
        String newPassword = request.getNewpass();
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải khác mật khẩu hiện tại.");
        }
        if (!newPassword.matches("^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ và số.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        logService.write(user, "USER_CHANGE_PASSWORD", "users", user.getId(), "Người dùng đặt lại mật khẩu thành công.");
    }

    @Transactional(readOnly = true)
    public UserDashboard getDashboard() {
        User user = currentUserService.get();
        if (user == null) {
            return null;
        }
        Long customerId = user.getId();
        Long totalOrders = jdbc.queryForObject("""
                SELECT COUNT(id) FROM orders WHERE customer_id = ?
                """, Long.class, customerId);
        Long deliveringOrders = jdbc.queryForObject("""
                SELECT COUNT(id) FROM orders WHERE customer_id = ? AND status = 'SHIPPING'
                """, Long.class, customerId);
        List<UserOrder> recentOrders = jdbc.query("""
                SELECT o.id, o.order_code, o.created_at, o.status, o.total_amount, GROUP_CONCAT(oi.item_name SEPARATOR ', ') AS item_names
                FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
                WHERE o.customer_id = ?
                GROUP BY o.id, o.order_code, o.created_at, o.status, o.total_amount
                ORDER BY o.created_at DESC, o.id DESC
                LIMIT 3
                """,
                (rs, rowNum) -> {
                    UserOrder dto = new UserOrder();
                    dto.setId(rs.getLong("id"));
                    dto.setOrderCode(rs.getString("order_code"));
                    if (rs.getTimestamp("created_at") != null) {
                        dto.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    }
                    dto.setStatus(rs.getString("status"));
                    dto.setTotalAmount(rs.getBigDecimal("total_amount"));
                    String itemNames = rs.getString("item_names");
                    dto.setItemNames(itemNames == null || itemNames.isBlank() ? List.of() : List.of(itemNames.split(", ")));
                    return dto;
                }, customerId
        );
        UserDashboard res = new UserDashboard();

        res.setTotalOrders(totalOrders != null ? totalOrders : 0L);
        res.setDeliveringOrders(deliveringOrders != null ? deliveringOrders : 0L);
        res.setRecentOrders(recentOrders);

        return res;
    }
}