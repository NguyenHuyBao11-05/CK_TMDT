package com.flower.server.controller;

import com.flower.server.dto.UserRegister;
import com.flower.server.dto.UserLogin;
import com.flower.server.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {
    private final AuthService authService;
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody UserRegister request, HttpSession session) {
        try {
            authService.register(request, session);
            return ResponseEntity.ok(Map.of("message", "Mã OTP đã được gửi đến email của bạn."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (org.springframework.mail.MailException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", "Không thể gửi email OTP. Vui lòng thử lại."));
        }
    }

    @PostMapping("/register/verify")
    public ResponseEntity<Map<String, String>> verifyRegisterOtp(@Valid @RequestBody VerifyOtpRequest request, HttpSession session) {
        try {
            authService.verifyOtp(request.otp(), session);
            return ResponseEntity.ok(Map.of("message", "Đăng ký tài khoản thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register/resend")
    public ResponseEntity<Map<String, String>> resendRegisterOtp(HttpSession session) {
        try {
            authService.resendOtp(session);
            return ResponseEntity.ok(Map.of("message", "Mã OTP mới đã được gửi."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (org.springframework.mail.MailException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", "Không thể gửi email OTP. Vui lòng thử lại."));
        }
    }

    public record VerifyOtpRequest(@NotBlank(message = "Vui lòng nhập mã OTP.")
                                   @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm 6 chữ số.") String otp) {
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLogin request, HttpSession session) {
        try {
            return ResponseEntity.ok(authService.login(request, session));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.LOCKED).body(Map.of("message", "Tài khoản đã bị khoá"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Email hoặc mật khẩu không đúng"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Map<String, Object> user = authService.getCurrentUser(session);
        if (user == null) {return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Bạn chưa đăng nhập."));}
        return ResponseEntity.ok(user);
    }
}