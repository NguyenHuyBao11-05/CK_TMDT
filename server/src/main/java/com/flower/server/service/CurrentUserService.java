package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.entity.UserStatus;
import com.flower.server.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class CurrentUserService {

    private final HttpServletRequest request;
    private final UserRepository users;

    public CurrentUserService(HttpServletRequest request, UserRepository users) {
        this.request = request;
        this.users = users;
    }

    public User get() {
        String header = request.getHeader("X-User-Id");
        if (header == null || header.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập.");
        }
        User user;
        try {
            user = users.findById(Long.parseLong(header.trim())).orElse(null);
        } catch (NumberFormatException e) {
            user = null;
        }
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại.");
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá.");
        }
        return user;
    }

    public User require(Role... roles) {
        User user = get();
        if (Arrays.stream(roles).noneMatch(r -> r == user.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
        }
        return user;
    }
}
