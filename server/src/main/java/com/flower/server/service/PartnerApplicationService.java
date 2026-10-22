package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.PartnerApplicationForm;
import com.flower.server.entity.PartnerApprovalStatus;
import com.flower.server.entity.PartnerProfile;
import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.repository.PartnerProfileRepository;
import com.flower.server.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerApplicationService {

    private final PartnerProfileRepository profiles;
    private final UserRepository users;
    private final LogService logService;
    private final NotificationService notificationService;

    public PartnerApplicationService(PartnerProfileRepository profiles, UserRepository users,
                                     LogService logService, NotificationService notificationService) {
        this.profiles = profiles;
        this.users = users;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Transactional
    public void apply(User customer, PartnerApplicationForm form) {
        String bio = form.bio().trim();
        String introduction = bio.lines()
                .filter(line -> line.startsWith("Giới thiệu:"))
                .map(line -> line.substring("Giới thiệu:".length()).trim())
                .findFirst()
                .orElse(bio);
        if (introduction.length() < 50) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phần giới thiệu thương hiệu phải có ít nhất 50 ký tự.");
        }

        PartnerProfile profile = profiles.findById(customer.getId()).orElseGet(PartnerProfile::new);
        boolean resubmission = profile.getUserId() != null;

        if (resubmission && profile.getApprovalStatus() != PartnerApprovalStatus.REJECTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Hồ sơ của bạn đã được gửi và đang chờ duyệt.");
        }

        profile.setUserId(customer.getId());
        profile.setBio(bio);
        profile.setPortfolioUrl(form.portfolioUrl().trim());
        profile.setApprovalStatus(PartnerApprovalStatus.PENDING);
        profile.setApprovedBy(null);
        profile.setApprovedAt(null);
        profile.setRejectReason(null);
        profiles.save(profile);

        logService.write(customer, "PARTNER_APPLY", "partner_profiles", customer.getId(),
                resubmission ? "Nộp lại hồ sơ đăng ký Đối tác." : "Gửi hồ sơ đăng ký Đối tác.");
        for (User manager : users.findAllByRole(Role.MANAGER)) {
            notificationService.notify(manager.getId(), "PARTNER_APPLY", "Có hồ sơ Đối tác mới",
                    customer.getFullName() + " đã gửi hồ sơ đăng ký Đối tác.",
                    "admin/partner-approvals.html");
        }
    }
}
