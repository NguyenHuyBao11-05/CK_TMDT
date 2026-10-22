package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.PartnerApplicationItem;
import com.flower.server.dto.RejectPartnerApplicationForm;
import com.flower.server.entity.PartnerApprovalStatus;
import com.flower.server.entity.PartnerProfile;
import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.repository.PartnerProfileRepository;
import com.flower.server.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminPartnerApprovalService {

    private final PartnerProfileRepository profiles;
    private final UserRepository users;
    private final JdbcTemplate jdbc;
    private final LogService logService;
    private final NotificationService notificationService;

    public AdminPartnerApprovalService(PartnerProfileRepository profiles, UserRepository users, JdbcTemplate jdbc,
                                       LogService logService, NotificationService notificationService) {
        this.profiles = profiles;
        this.users = users;
        this.jdbc = jdbc;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<PartnerApplicationItem> list() {
        return jdbc.query("""
                        SELECT p.user_id, u.full_name, u.email, u.phone, p.bio, p.portfolio_url,
                               p.approval_status, p.reject_reason, p.created_at
                        FROM partner_profiles p
                        JOIN users u ON u.id = p.user_id
                        ORDER BY p.created_at DESC, p.user_id DESC
                        """,
                (rs, rowNum) -> new PartnerApplicationItem(
                        rs.getLong("user_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("bio"),
                        rs.getString("portfolio_url"),
                        PartnerApprovalStatus.valueOf(rs.getString("approval_status")),
                        rs.getString("reject_reason"),
                        rs.getTimestamp("created_at").toLocalDateTime()));
    }

    @Transactional
    public void approve(User manager, Long userId) {
        PartnerProfile profile = findPending(userId);
        User applicant = findUser(userId);

        profile.setApprovalStatus(PartnerApprovalStatus.APPROVED);
        profile.setApprovedBy(manager.getId());
        profile.setApprovedAt(java.time.LocalDateTime.now());
        profile.setRejectReason(null);
        applicant.setRole(Role.PARTNER);

        logService.write(manager, "PARTNER_APPROVE", "partner_profiles", userId,
                "Phê duyệt hồ sơ Đối tác của " + applicant.getEmail() + ".");
        notificationService.notify(userId, "PARTNER_APPROVED", "Hồ sơ Đối tác đã được duyệt",
                "Hồ sơ đăng ký của bạn đã được phê duyệt. Bạn có thể bắt đầu sử dụng tài khoản Đối tác.",
                "partner/dashboard.html");
    }

    @Transactional
    public void reject(User manager, Long userId, RejectPartnerApplicationForm form) {
        PartnerProfile profile = findPending(userId);
        User applicant = findUser(userId);
        String reason = form.reason().trim();
        if (reason.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do từ chối.");
        }

        profile.setApprovalStatus(PartnerApprovalStatus.REJECTED);
        profile.setApprovedBy(null);
        profile.setApprovedAt(null);
        profile.setRejectReason(reason);

        logService.write(manager, "PARTNER_REJECT", "partner_profiles", userId,
                "Từ chối hồ sơ Đối tác của " + applicant.getEmail() + ". Lý do: " + reason);
        notificationService.notify(userId, "PARTNER_REJECTED", "Hồ sơ Đối tác cần được bổ sung",
                "Hồ sơ đăng ký của bạn chưa được duyệt. Lý do: " + reason,
                "partner/register.html");
    }

    private PartnerProfile findPending(Long userId) {
        PartnerProfile profile = profiles.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ Đối tác."));
        if (profile.getApprovalStatus() != PartnerApprovalStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Hồ sơ này không còn ở trạng thái chờ duyệt.");
        }
        return profile;
    }

    private User findUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản ứng viên."));
    }
}
