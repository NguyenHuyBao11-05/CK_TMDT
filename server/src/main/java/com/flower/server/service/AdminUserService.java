package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.UserForm;
import com.flower.server.dto.UserItem;
import com.flower.server.dto.UserPage;
import com.flower.server.entity.AuthProvider;
import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.entity.UserStatus;
import com.flower.server.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class AdminUserService {

    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    private final UserRepository users;
    private final LogService logService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public AdminUserService(UserRepository users, LogService logService, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.logService = logService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserPage search(String q, Role role, UserStatus status, int page, int size) {
        Page<User> result = users.findAll(
                filter(q, role, status),
                PageRequest.of(Math.max(page, 0), size, Sort.by(Sort.Direction.DESC, "id")));

        UserPage.Stats stats = new UserPage.Stats(
                users.count(),
                users.countByRole(Role.CUSTOMER),
                users.countByRole(Role.PARTNER),
                users.countByStatus(UserStatus.LOCKED));

        return new UserPage(
                result.getContent().stream().map(UserItem::from).toList(),
                result.getNumber(),
                result.getTotalPages(),
                result.getTotalElements(),
                stats);
    }

    @Transactional
    public UserItem create(User admin, UserForm form) {
        if (form.password() == null || form.password().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng nhập mật khẩu.");
        }
        String email = form.email().trim();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email này đã được dùng cho tài khoản khác.");
        }

        User user = new User();
        user.setFullName(form.fullName().trim());
        user.setEmail(email);
        user.setPhone(blankToNull(form.phone()));
        user.setRole(form.role());
        user.setStatus(form.status());
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setPasswordHash(passwordEncoder.encode(form.password()));
        users.save(user);

        logService.write(admin, "USER_CREATE", "users", user.getId(),
                "Tạo tài khoản " + email + " với vai trò " + form.role() + ".");
        return UserItem.from(user);
    }

    @Transactional
    public UserItem update(User admin, Long id, UserForm form) {
        User user = find(id);
        String email = form.email().trim();
        if (users.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email này đã được dùng cho tài khoản khác.");
        }
        protectSelf(admin, user, form.role(), form.status());

        Role oldRole = user.getRole();
        UserStatus oldStatus = user.getStatus();
        boolean infoChanged = !user.getFullName().equals(form.fullName().trim())
                || !user.getEmail().equals(email)
                || !Objects.equals(user.getPhone(), blankToNull(form.phone()));

        user.setFullName(form.fullName().trim());
        user.setEmail(email);
        user.setPhone(blankToNull(form.phone()));
        user.setRole(form.role());
        user.setStatus(form.status());

        if (infoChanged) {
            logService.write(admin, "USER_UPDATE", "users", id, "Cập nhật thông tin tài khoản " + email + ".");
        }
        if (oldRole != form.role()) {
            logService.write(admin, "USER_ROLE", "users", id,
                    "Đổi vai trò tài khoản " + email + ": " + oldRole + " → " + form.role() + ".");
        }
        if (oldStatus != form.status()) {
            writeStatusLog(admin, user);
        }
        return UserItem.from(user);
    }

    @Transactional
    public UserItem changeStatus(User admin, Long id, UserStatus status) {
        User user = find(id);
        protectSelf(admin, user, user.getRole(), status);
        if (user.getStatus() != status) {
            user.setStatus(status);
            writeStatusLog(admin, user);
        }
        return UserItem.from(user);
    }

    @Transactional
    public String resetPassword(User admin, Long id) {
        User user = find(id);
        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản đăng nhập bằng Google không dùng mật khẩu.");
        }
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            password.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        user.setPasswordHash(passwordEncoder.encode(password));
        logService.write(admin, "USER_RESET_PASSWORD", "users", id,
                "Đặt lại mật khẩu cho tài khoản " + user.getEmail() + ".");
        return password.toString();
    }

    private User find(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại."));
    }

    private void protectSelf(User admin, User target, Role newRole, UserStatus newStatus) {
        if (!admin.getId().equals(target.getId())) {
            return;
        }
        if (newStatus == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn không thể tự khoá tài khoản của chính mình.");
        }
        if (newRole != Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn không thể tự bỏ quyền Admin của chính mình.");
        }
    }

    private void writeStatusLog(User admin, User user) {
        boolean locked = user.getStatus() == UserStatus.LOCKED;
        logService.write(admin, locked ? "USER_LOCK" : "USER_UNLOCK", "users", user.getId(),
                (locked ? "Khoá" : "Mở khoá") + " tài khoản " + user.getEmail() + ".");
    }

    private Specification<User> filter(String q, Role role, UserStatus status) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (role != null) {
                where.add(cb.equal(root.get("role"), role));
            }
            if (status != null) {
                where.add(cb.equal(root.get("status"), status));
            }
            if (q != null && !q.isBlank()) {
                String keyword = "%" + q.trim().toLowerCase() + "%";
                where.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), keyword),
                        cb.like(cb.lower(root.get("email")), keyword),
                        cb.like(root.get("phone"), keyword)));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
