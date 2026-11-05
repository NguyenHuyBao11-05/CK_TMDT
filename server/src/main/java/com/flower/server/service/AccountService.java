package com.flower.server.service;

import com.flower.server.dto.ProfileUpdateRequest;
import com.flower.server.dto.Profile;
import com.flower.server.dto.UserChangePasswordRequest;
import com.flower.server.entity.AuthProvider;
import com.flower.server.entity.User;
import com.flower.server.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final LogService logService;

    private final PasswordEncoder passwordEncoder;

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
}