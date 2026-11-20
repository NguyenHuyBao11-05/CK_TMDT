package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.*;
import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Set;

@Service
public class ComplaintService {
    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUser;
    private final LogService logService;
    private final NotificationService notificationService;

    public ComplaintService(JdbcTemplate jdbcTemplate, CurrentUserService currentUser, LogService logService, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    //  ============================= get can be complained orders =============================
    public List<CanComplaintOrder> getCanComplaintOrders() {
        User customer = currentUser.require(Role.CUSTOMER);
        String sql = """
                SELECT
                    o.id,
                    o.order_code,
                    o.created_at,
                    o.status,
                    o.total_amount
                FROM orders o
                WHERE o.customer_id = ?
                  AND o.partner_id IS NOT NULL
                  AND o.status IN ('SHIPPING', 'RECEIVED')
                  AND NOT EXISTS (
                      SELECT 1
                      FROM complaints c
                      WHERE c.order_id = o.id
                        AND c.moderation_status <> 'RESOLVED'
                  )
                ORDER BY o.created_at DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CanComplaintOrder(
                rs.getLong("id"),
                rs.getString("order_code"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getString("status"),
                rs.getBigDecimal("total_amount")
        ), customer.getId());
    }

    //  ============================= create complaint =============================
    @Transactional
    public CreateComplaintResponse createComplaint(CreateComplaintRequest request) {
        User customer = currentUser.require(Role.CUSTOMER);
        List<OrderComplaintRow> orders = jdbcTemplate.query("""
                SELECT id, customer_id, partner_id, status
                FROM orders
                WHERE id = ?
                  AND customer_id = ?
                FOR UPDATE
                """, (rs, rowNum) -> new OrderComplaintRow(
                rs.getLong("id"),
                rs.getLong("customer_id"),
                rs.getObject("partner_id", Long.class),
                rs.getString("status")), request.orderId(), customer.getId()
        );
        if (orders.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }
        OrderComplaintRow order = orders.get(0);
        if (order.partnerId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn hàng chưa được phân công đối tác nên chưa thể khiếu nại.");
        }
        if ("PENDING".equals(order.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn chưa được xử lý, bạn có thể huỷ đơn.");
        }

        if (!"SHIPPING".equals(order.status()) && !"RECEIVED".equals(order.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ có thể khiếu nại đơn hàng đang giao hoặc đã nhận.");
        }

        List<Long> activeComplaints = jdbcTemplate.query("""
                SELECT id
                FROM complaints
                WHERE order_id = ?
                  AND moderation_status <> 'RESOLVED'
                LIMIT 1
                """, (rs, rowNum) -> rs.getLong("id"), order.id()
        );
        if (!activeComplaints.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn hàng này đã có khiếu nại đang được xử lý.");
        }
        String description = request.description().trim();
        if (description.length() < 20) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nội dung khiếu nại phải có ít nhất 20 ký tự.");
        }
        String imageUrl = request.evidenceImageUrl();
        if (imageUrl != null && imageUrl.isBlank()) {
            imageUrl = null;
        }

        final String finalImageUrl = imageUrl;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO complaints (
                        order_id,
                        customer_id,
                        partner_id,
                        description,
                        evidence_image_url,
                        moderation_status
                    )
                    VALUES (?, ?, ?, ?, ?, 'PENDING_PARTNER')
                    """, Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, order.id());
            ps.setLong(2, customer.getId());
            ps.setLong(3, order.partnerId());
            ps.setString(4, description);
            if (finalImageUrl == null) {
                ps.setNull(5, java.sql.Types.VARCHAR);
            } else {
                ps.setString(5, finalImageUrl);
            }
            return ps;
        }, keyHolder);
        Number generatedId = keyHolder.getKey();

        if (generatedId == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo khiếu nại.");
        }

        Long complaintId = generatedId.longValue();
        notificationService.notify(order.partnerId(), "COMPLAINT_CREATE", "Khiếu nại", "Khách hàng gửi khiếu nại về đơn hàng.", "/CK_TMDT/web/partner/complaints.html");
        logService.write(customer, "COMPLAINT_CREATE", "complaints", complaintId, "Khách hàng gửi khiếu nại về đơn hàng ID " + order.id() + ".");
        return new CreateComplaintResponse(complaintId, order.id(), "PENDING_PARTNER", "Gửi khiếu nại thành công.");
    }

    //  ============================= mine =============================
    public List<MyComplaintItem> getMyComplaints() {
        User customer = currentUser.require(Role.CUSTOMER);
        String sql = """
                SELECT
                    c.id,
                    c.order_id,
                    o.order_code,
                    c.description,
                    c.evidence_image_url,
                    c.partner_response,
                    c.partner_responded_at,
                    c.moderation_status,
                    c.moderation_note,
                    c.moderated_at,
                    c.created_at
                FROM complaints c
                JOIN orders o ON o.id = c.order_id
                WHERE c.customer_id = ?
                ORDER BY c.created_at DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new MyComplaintItem(
                rs.getLong("id"),
                rs.getLong("order_id"),
                rs.getString("order_code"),
                rs.getString("description"),
                rs.getString("evidence_image_url"),
                rs.getString("partner_response"),
                rs.getTimestamp("partner_responded_at") != null ? rs.getTimestamp("partner_responded_at").toLocalDateTime() : null,
                rs.getString("moderation_status"),
                rs.getString("moderation_note"),
                rs.getTimestamp("moderated_at") != null ? rs.getTimestamp("moderated_at").toLocalDateTime() : null,
                rs.getTimestamp("created_at").toLocalDateTime()
        ), customer.getId());
    }


    // ============================= partner complaints =============================
    public List<PartnerComplaintItem> getPartnerComplaints() {
        User partner = currentUser.require(Role.PARTNER);
        String sql = """
                SELECT
                    c.id,
                    c.order_id,
                    o.order_code,
                    u.full_name AS customer_name,
                    c.description,
                    c.evidence_image_url,
                    c.partner_response,
                    c.moderation_status,
                    c.moderation_note,
                    c.created_at,
                    c.partner_responded_at,
                    o.total_amount AS order_total,
                    GROUP_CONCAT(oi.item_name
                        ORDER BY oi.id
                        SEPARATOR ', '
                    ) AS product_name,
                    GROUP_CONCAT(COALESCE(p.thumbnail_url, '')
                        ORDER BY oi.id
                        SEPARATOR ', '
                    ) AS product_image,
                    SUM(oi.quantity) AS quantity
                FROM complaints c
                JOIN orders o ON o.id = c.order_id
                JOIN users u ON u.id = c.customer_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE c.partner_id = ?
                GROUP BY
                    c.id,
                    c.order_id,
                    o.order_code,
                    u.full_name,
                    c.description,
                    c.evidence_image_url,
                    c.partner_response,
                    c.moderation_status,
                    c.moderation_note,
                    c.created_at,
                    c.partner_responded_at,
                    o.total_amount
                ORDER BY
                    CASE
                        WHEN c.moderation_status IN ('PENDING_PARTNER', 'NEEDS_REWORK') THEN 0
                        ELSE 1
                    END,
                    c.created_at DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new PartnerComplaintItem(
                rs.getLong("id"),
                rs.getLong("order_id"),
                rs.getString("order_code"),
                rs.getString("customer_name"),
                rs.getString("description"),
                rs.getString("evidence_image_url"),
                rs.getString("partner_response"),
                rs.getString("moderation_status"),
                rs.getString("moderation_note"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getTimestamp("partner_responded_at") != null ? rs.getTimestamp("partner_responded_at").toLocalDateTime() : null,
                rs.getBigDecimal("order_total"),
                rs.getString("product_name"),
                rs.getString("product_image"),
                rs.getObject("quantity", Integer.class)
        ), partner.getId());
    }


    // ============================= partner respond complaint =============================
    @Transactional
    public void respondToComplaint(Long complaintId, PartnerComplaintResponseRequest request) {
        User partner = currentUser.require(Role.PARTNER);
        Set<String> allowedTypes = Set.of(
                "PARTIAL_REFUND",
                "REMAKE",
                "EXPLANATION"
        );

        String responseType = request.responseType().trim();
        if (!allowedTypes.contains(responseType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phương án xử lý không hợp lệ.");
        }
        String content = request.content().trim();
        if (content.length() < 20) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nội dung phản hồi phải có ít nhất 20 ký tự.");
        }

        List<ComplaintResponseRow> complaints = jdbcTemplate.query("""
                        SELECT id, customer_id, moderation_status
                        FROM complaints
                        WHERE id = ?
                          AND partner_id = ?
                        FOR UPDATE
                        """,
                (rs, rowNum) -> new ComplaintResponseRow(
                        rs.getLong("id"),
                        rs.getLong("customer_id"),
                        rs.getString("moderation_status")
                ), complaintId, partner.getId()
        );

        if (complaints.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy khiếu nại.");
        }

        ComplaintResponseRow complaint = complaints.get(0);

        if (!"PENDING_PARTNER".equals(complaint.moderationStatus()) && !"NEEDS_REWORK".equals(complaint.moderationStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Khiếu nại hiện không ở trạng thái chờ đối tác phản hồi.");
        }

        String responseTypeLabel = switch (responseType) {
            case "PARTIAL_REFUND" -> "Hoàn tiền một phần";
            case "REMAKE" -> "Làm lại sản phẩm";
            case "EXPLANATION" -> "Giải thích";
            default -> throw new IllegalStateException("Unexpected response type");
        };

        String partnerResponse = "[" + responseTypeLabel + "]\n" + content;

        jdbcTemplate.update("""
                UPDATE complaints
                SET partner_response = ?,
                    partner_responded_at = CURRENT_TIMESTAMP,
                    moderation_status = 'PENDING_REVIEW',
                    moderation_note = NULL
                WHERE id = ?
                """, partnerResponse, complaintId
        );

        notificationService.notify(complaint.customerId(), "COMPLAINT_RESPOND", "Đối tác phản hồi khiếu nại", "Đối tác đã gửi phản hồi. Khiếu nại đang chờ Quản lý xem xét.", "/CK_TMDT/web/account/complaints.html");
        notifyAllAdmins("COMPLAINT_RESPOND", "Khiếu nại cần xem xét", "Đối tác phản hồi khiếu nại và đang chờ Quản lý xem xét.", "/CK_TMDT/web/admin/complaints.html");
        logService.write(partner, "COMPLAINT_RESPOND", "complaints", complaintId, "Đối tác phản hồi khiếu (" + responseTypeLabel + ").");
    }

    private void notifyAllAdmins(String type, String title, String content, String link) {
        List<Long> adminIds = jdbcTemplate.queryForList("SELECT id FROM users WHERE role = 'ADMIN'", Long.class);
        for (Long adminId : adminIds) {
            notificationService.notify(adminId, type, title, content, link);
        }
    }

    // ============================= admin complaints =============================
    public List<AdminComplaintItem> getAdminComplaints() {
        String sql = """
                SELECT
                    c.id,
                    c.order_id,
                    o.order_code,
                    customer.full_name AS customer_name,
                    partner.full_name AS partner_name,
                    c.description,
                    c.evidence_image_url,
                    c.partner_response,
                    c.moderation_status,
                    c.moderation_note,
                    c.created_at,
                    c.partner_responded_at,
                    o.total_amount AS order_total
                FROM complaints c
                JOIN orders o ON o.id = c.order_id
                JOIN users customer ON customer.id = c.customer_id
                JOIN users partner ON partner.id = c.partner_id
                WHERE c.moderation_status = 'PENDING_REVIEW'
                ORDER BY c.created_at ASC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new AdminComplaintItem(
                rs.getLong("id"),
                rs.getLong("order_id"),
                rs.getString("order_code"),
                rs.getString("customer_name"),
                rs.getString("partner_name"),
                rs.getString("description"),
                rs.getString("evidence_image_url"),
                rs.getString("partner_response"),
                rs.getString("moderation_status"),
                rs.getString("moderation_note"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getTimestamp("partner_responded_at") != null ? rs.getTimestamp("partner_responded_at").toLocalDateTime() : null,
                rs.getBigDecimal("order_total")
        ));
    }


    @Transactional
    public void resolveComplaint(Long complaintId, String moderationNote) {
        User manager = currentUser.require(Role.MANAGER);
        String sql = """
                SELECT customer_id, partner_id, moderation_status
                FROM complaints
                WHERE id = ?
                FOR UPDATE
                """;
        List<ComplaintReviewRow> rows = jdbcTemplate.query(sql, (rs, rowNum) -> new ComplaintReviewRow(
                rs.getLong("customer_id"),
                rs.getLong("partner_id"),
                rs.getString("moderation_status")), complaintId
        );
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy khiếu nại.");
        }
        ComplaintReviewRow complaint = rows.get(0);
        if (!"PENDING_REVIEW".equals(complaint.moderationStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Khiếu nại không ở trạng thái chờ kiểm duyệt.");
        }
        String updateSql = """
                UPDATE complaints
                SET moderation_status = 'RESOLVED',
                    moderation_note = ?,
                    moderated_by = ?,
                    moderated_at = NOW()
                WHERE id = ?
                  AND moderation_status = 'PENDING_REVIEW'
                """;
        int updated = jdbcTemplate.update(updateSql, moderationNote == null || moderationNote.isBlank() ? null : moderationNote.trim(), manager.getId(), complaintId);
        if (updated == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể đóng khiếu nại này.");
        }
        notificationService.notify(complaint.customerId(), "COMPLAINT_RESOLVE", "Khiếu nại đã được giải quyết", "Khiếu nại #" + complaintId + " đã được Quản lý kiểm duyệt và đóng.", null);
        notificationService.notify(complaint.partnerId(), "COMPLAINT_RESOLVE", "Khiếu nại đã được giải quyết", "Khiếu nại #" + complaintId + " đã được Quản lý kiểm duyệt và đóng.", null);
        logService.write(manager, "COMPLAINT_RESOLVE", "complaints", complaintId, "Quản lý đã đóng khiếu nại #" + complaintId);
    }

    @Transactional
    public void reworkComplaint(Long complaintId, String moderationNote) {
        User manager = currentUser.require(Role.MANAGER);
        if (moderationNote == null || moderationNote.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do yêu cầu xử lý lại.");
        }
        String sql = """
                SELECT customer_id, partner_id, moderation_status
                FROM complaints
                WHERE id = ?
                FOR UPDATE
                """;
        List<ComplaintReviewRow> rows = jdbcTemplate.query(sql, (rs, rowNum) -> new ComplaintReviewRow(
                rs.getLong("customer_id"),
                rs.getLong("partner_id"),
                rs.getString("moderation_status")), complaintId
        );
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy khiếu nại.");
        }
        ComplaintReviewRow complaint = rows.get(0);
        if (!"PENDING_REVIEW".equals(complaint.moderationStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Khiếu nại không ở trạng thái chờ kiểm duyệt.");
        }
        String updateSql = """
                UPDATE complaints
                SET moderation_status = 'NEEDS_REWORK',
                    moderation_note = ?,
                    moderated_by = ?,
                    moderated_at = NOW()
                WHERE id = ?
                  AND moderation_status = 'PENDING_REVIEW'
                """;
        int updated = jdbcTemplate.update(updateSql, moderationNote.trim(), manager.getId(), complaintId);
        if (updated == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể yêu cầu xử lý lại khiếu nại này.");
        }
        notificationService.notify(complaint.customerId(), "COMPLAINT_REWORK", "Khiếu nại đang được xử lý lại", "Khiếu nại #" + complaintId + " đã được yêu cầu xử lý lại.", null);
        notificationService.notify(complaint.partnerId(), "COMPLAINT_REWORK", "Bạn cần xử lý lại khiếu nại", "Khiếu nại #" + complaintId + " cần được xử lý lại. Lý do: " + moderationNote.trim(), null);
        logService.write(manager, "COMPLAINT_REWORK", "complaints", complaintId, "Quản lý yêu cầu xử lý lại khiếu nại #" + complaintId + ". Lý do: " + moderationNote.trim());
    }

    private record ComplaintReviewRow(Long customerId, Long partnerId, String moderationStatus) {
    }

    private record OrderComplaintRow(Long id, Long customerId, Long partnerId, String status) {
    }

    private record ComplaintResponseRow(Long id, Long customerId, String moderationStatus) {
    }
}