package com.flower.server.service;

import com.flower.server.dto.UserRegister;
import com.flower.server.dto.UserLogin;
import com.flower.server.entity.AuthProvider;
import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.entity.UserStatus;
import com.flower.server.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.flower.server.dto.GoogleLoginRequest;
import java.io.IOException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String PENDING_KEY = "PENDING_REGISTER";
    private static final String PENDING_RESET_KEY = "PENDING_PASSWORD_RESET";
    private static final long OTP_LIFETIME = 5 * 60 * 1000L;
    private static final long RESEND_COOLDOWN = 60 * 1000L;
    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_SENDS_PER_HOUR = 5;

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOGIN_LOCK_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    private final LogService logService;
    @Value("${spring.mail.username}")
    private String mailFrom;

    // ===================== register =====================
    public void register(UserRegister request, HttpSession session) {
        String email = request.email().trim();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email này đã được đăng ký.");
        }
        PendingRegistration pending = new PendingRegistration();
        pending.username = request.username().trim();
        pending.email = email;
        pending.phone = request.phone();
        pending.passwordHash = passwordEncoder.encode(request.password());
        pending.sendTimes = new ArrayList<>();
        sendNewOtp(pending);
        session.setAttribute(PENDING_KEY, pending);
    }

    public void verifyOtp(String otp, HttpSession session) {
        PendingRegistration pending = getPending(session);
        if (System.currentTimeMillis() > pending.expiresAt) {
            session.removeAttribute(PENDING_KEY);
            throw new IllegalArgumentException("Mã OTP đã hết hạn. Vui lòng đăng ký lại.");
        }
        if (pending.attempts >= MAX_ATTEMPTS) {
            session.removeAttribute(PENDING_KEY);
            throw new IllegalArgumentException("Bạn đã nhập sai OTP quá số lần cho phép.");
        }
        if (otp == null || !otp.matches("\\d{6}") || !otp.equals(pending.otp)) {
            pending.attempts++;
            if (pending.attempts >= MAX_ATTEMPTS) {
                session.removeAttribute(PENDING_KEY);
            }
            throw new IllegalArgumentException("Mã OTP không chính xác.");
        }

        if (userRepository.existsByEmailIgnoreCase(pending.email)) {
            session.removeAttribute(PENDING_KEY);
            throw new IllegalArgumentException("Email này đã được đăng ký.");
        }
        User user = new User();
        user.setFullName(pending.username);
        user.setEmail(pending.email);
        user.setPhone(pending.phone);
        user.setPasswordHash(pending.passwordHash);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setRole(Role.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);

        userRepository.save(user);
        logService.write(user, "USER_REGISTER", "users", user.getId(), "Người dùng đăng ký tài khoản thành công LOCAL.");
        session.removeAttribute(PENDING_KEY);
    }

    public void resendOtp(HttpSession session) {
        PendingRegistration pending = getPending(session);
        long now = System.currentTimeMillis();
        pending.sendTimes.removeIf(time -> now - time >= 60 * 60 * 1000L);
        if (pending.sendTimes.size() >= MAX_SENDS_PER_HOUR) {
            throw new IllegalArgumentException("Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau.");
        }
        if (now - pending.lastSentAt < RESEND_COOLDOWN) {
            throw new IllegalArgumentException("Vui lòng đợi 60 giây trước khi gửi lại OTP.");
        }
        sendNewOtp(pending);
    }

    private PendingRegistration getPending(HttpSession session) {
        PendingRegistration pending = (PendingRegistration) session.getAttribute(PENDING_KEY);
        if (pending == null) {
            throw new IllegalArgumentException("Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại.");
        }
        return pending;
    }

    private void sendNewOtp(PendingRegistration pending) {
        long now = System.currentTimeMillis();
        String otp = String.format("%06d", random.nextInt(1_000_000));
        SimpleMailMessage message = getSimpleMailMessage(pending, otp);
        mailSender.send(message);
        pending.otp = otp;
        pending.expiresAt = now + OTP_LIFETIME;
        pending.lastSentAt = now;
        pending.attempts = 0;
        if (pending.sendTimes == null) {
            pending.sendTimes = new ArrayList<>();
        }
        pending.sendTimes.add(now);
    }

    private SimpleMailMessage getSimpleMailMessage(PendingRegistration pending, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(pending.email);
        message.setSubject("Mã OTP xác minh tài khoản FW12");
        message.setText("Xin chào " + pending.username + ",\n\n"
                + "Mã OTP đăng ký tài khoản của bạn là: " + otp + "\n"
                + "Mã có hiệu lực trong 5 phút.\n"
                + "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.\n\n"
                + "FW12");
        return message;
    }

    // ===================== login =====================
    public Map<String, Object> login(UserLogin request, HttpSession session) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        String password = request.getPassword();
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            logService.write(null, "LOGIN_FAILED", "users", null, "Đăng nhập thất bại do thông tin xác thực không chính xác.");
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            logService.write(user, "LOGIN_FAILED", "users", user.getId(), "Đăng nhập thất bại do tài khoản bị khóa.");
            throw new IllegalStateException("Tài khoản đã bị khóa.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (user.getLoginLockedUntil() != null && now.isBefore(user.getLoginLockedUntil())) {
            if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
                logService.write(user, "LOGIN_FAILED", "users", user.getId(), "Đăng nhập thất bại do thông tin xác thực không chính xác.");
                throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
            }
            logService.write(user, "LOGIN_FAILED", "users", user.getId(), "Đăng nhập thất bại do tài khoản đang bị khóa tạm thời.");
            throw new IllegalStateException("Tài khoản đang bị khoá.");
        }
        if (user.getLoginLockedUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLoginLockedUntil(null);
        }
        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                user.setLoginLockedUntil(now.plusMinutes(LOGIN_LOCK_MINUTES));
            }
            userRepository.save(user);
            logService.write(user, "LOGIN_FAILED", "users", user.getId(), attempts >= MAX_LOGIN_ATTEMPTS
                    ? "Đăng nhập thất bại 5 lần liên tiếp, khóa đăng nhập 15 phút."
                    : "Đăng nhập thất bại do thông tin xác thực không chính xác.");
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }
        user.setFailedLoginAttempts(0);
        user.setLoginLockedUntil(null);
        userRepository.save(user);
        session.setAttribute("userId", user.getId());
        logService.write(user, "LOGIN", "users", user.getId(), "Đăng nhập thành công");

        return userResponse(user);
    }

    private Map<String, Object> userResponse(User user) {
        return Map.of("id", user.getId(), "full_name", user.getFullName(), "role", user.getRole().name());
    }

    // ===================== google login =====================
    public Map<String, Object> loginWithGoogle(GoogleLoginRequest request, HttpSession session) {
        final GoogleIdToken.Payload payload;
        try {
            GoogleIdToken token = googleIdTokenVerifier.verify(request.getToken());
            if (token == null) {
                throw new IllegalArgumentException("Google ID token không hợp lệ hoặc đã hết hạn.");
            }
            payload = token.getPayload();
        } catch (IOException | java.security.GeneralSecurityException | RuntimeException e) {
            throw new IllegalArgumentException("Không thể xác minh tài khoản Google.");
        }
        String googleId = payload.getSubject();
        String email = payload.getEmail();
        if (googleId == null || email == null || !Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new IllegalArgumentException("Tài khoản Google chưa xác minh email.");
        }

        User user = userRepository.findByGoogleId(googleId).orElse(null);
        if (user == null) {
            user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user != null) {
                if (user.getGoogleId() == null || user.getGoogleId().isBlank()) {
                    user.setGoogleId(googleId);
                    userRepository.save(user);
                } else if (!user.getGoogleId().equals(googleId)) {
                    throw new IllegalArgumentException("Email này đã liên kết với tài khoản Google khác.");
                }
            }
        }

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFullName(payload.get("name") == null ? email.substring(0, email.indexOf('@')) : payload.get("name").toString());
            user.setGoogleId(googleId);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setRole(Role.CUSTOMER);
            user.setStatus(UserStatus.ACTIVE);
            user.setPasswordHash(null);
            user = userRepository.save(user);
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            logService.write(user, "LOGIN_FAILED", "users", user.getId(), "Đăng nhập Google thất bại do tài khoản bị khóa.");
            throw new IllegalStateException("Tài khoản đã bị khóa.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (user.getLoginLockedUntil() != null && now.isBefore(user.getLoginLockedUntil())) {
            logService.write(user, "LOGIN_FAILED", "users", user.getId(), "Đăng nhập thất bại do tài khoản đang bị khóa tạm thời.");
            throw new IllegalStateException("Tài khoản đang bị khoá.");
        }

        session.setAttribute("userId", user.getId());
        logService.write(user, "LOGIN", "users", user.getId(), "Đăng nhập bằng google");
        return userResponse(user);
    }

    // ===================== forget password =====================
    public void forgotPassword(String rawEmail, HttpSession session) {
        String email = rawEmail == null ? "" : rawEmail.trim();
        long now = System.currentTimeMillis();
        PendingPasswordReset pending = (PendingPasswordReset) session.getAttribute(PENDING_RESET_KEY);

        if (pending != null && pending.email.equalsIgnoreCase(email)) {
            pending.sendTimes.removeIf(time -> now - time >= 60 * 60 * 1000L);
            if (now - pending.lastSentAt < RESEND_COOLDOWN) {
                throw new IllegalArgumentException("Vui lòng đợi 60 giây trước khi gửi lại mã.");
            }
            if (pending.sendTimes.size() >= MAX_SENDS_PER_HOUR) {
                throw new IllegalArgumentException("Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau.");
            }
        } else {
            pending = new PendingPasswordReset();
            pending.email = email;
            pending.sendTimes = new ArrayList<>();
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        pending.otp = null;
        pending.expiresAt = 0;
        pending.attempts = 0;
        pending.lastSentAt = now;
        pending.sendTimes.add(now);

        if (user != null && user.getAuthProvider() == AuthProvider.GOOGLE) {
            sendPasswordResetMail(email, "Hướng dẫn đăng nhập FW12", "Tài khoản của bạn sử dụng đăng nhập Google.\n" + "Vui lòng đăng nhập bằng Google.");
        } else if (user != null && user.getAuthProvider() == AuthProvider.LOCAL && user.getStatus() == UserStatus.ACTIVE) {
            String otp = String.format("%06d", random.nextInt(1_000_000));
            sendPasswordResetMail(email, "Mã OTP đặt lại mật khẩu FW12",
                    "Mã OTP đặt lại mật khẩu của bạn là: " + otp + "\n"
                            + "Mã có hiệu lực trong 5 phút.\n"
                            + "Nếu bạn không yêu cầu đặt lại mật khẩu, "
                            + "hãy bỏ qua email này."
            );
            pending.otp = otp;
            pending.expiresAt = now + OTP_LIFETIME;
        }
        session.setAttribute(PENDING_RESET_KEY, pending);
    }

    public void resetPassword(String rawEmail, String otp, String password, HttpSession session) {
        String email = rawEmail == null ? "" : rawEmail.trim();
        PendingPasswordReset pending = (PendingPasswordReset) session.getAttribute(PENDING_RESET_KEY);
        if (pending == null || !pending.email.equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("Yêu cầu đã hết hạn. Vui lòng thực hiện lại.");
        }
        long now = System.currentTimeMillis();
        if (pending.attempts >= MAX_ATTEMPTS) {
            session.removeAttribute(PENDING_RESET_KEY);
            throw new IllegalArgumentException("Bạn đã nhập sai OTP quá số lần cho phép.");
        }

        if (pending.otp == null) {
            throw new IllegalArgumentException("OTP không hợp lệ hoặc đã hết hạn.");
        }

        if (now > pending.expiresAt) {
            session.removeAttribute(PENDING_RESET_KEY);
            throw new IllegalArgumentException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        if (otp == null || !otp.matches("\\d{6}") || !otp.equals(pending.otp)) {
            pending.attempts++;
            if (pending.attempts >= MAX_ATTEMPTS) {
                session.removeAttribute(PENDING_RESET_KEY);
            }
            throw new IllegalArgumentException("Mã OTP không chính xác.");
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new IllegalArgumentException("OTP không hợp lệ hoặc đã hết hạn."));
        if (user.getAuthProvider() != AuthProvider.LOCAL || user.getStatus() != UserStatus.ACTIVE) {
            session.removeAttribute(PENDING_RESET_KEY);
            throw new IllegalArgumentException("Không thể đặt lại mật khẩu cho tài khoản này.");
        }

        if (password == null || password.length() < 8 || password.length() > 72 || !password.matches("(?s)(?=.*[A-Za-z])(?=.*\\d).+")) {
            throw new IllegalArgumentException("Mật khẩu phải có từ 8 đến 72 ký tự, gồm chữ và số.");
        }
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        logService.write(user, "USER_RESET_PASSWORD", "users", user.getId(), "Người dùng đặt lại mật khẩu thành công.");
        session.removeAttribute(PENDING_RESET_KEY);
    }

    private void sendPasswordResetMail(String email, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject(subject);
        message.setText(content + "\n\nFW12");
        mailSender.send(message);
    }

    public void logout(User user) {
        logService.write(user, "LOGOUT", "users", user.getId(), "Người dùng đăng xuất.");
    }

    private static class PendingRegistration {
        private String username;
        private String email;
        private String phone;
        private String passwordHash;
        private String otp;

        private long expiresAt;
        private long lastSentAt;
        private int attempts;

        private List<Long> sendTimes;
    }

    private static class PendingPasswordReset {
        private String email;
        private String otp;

        private long expiresAt;
        private long lastSentAt;
        private int attempts;

        private List<Long> sendTimes;
    }
}