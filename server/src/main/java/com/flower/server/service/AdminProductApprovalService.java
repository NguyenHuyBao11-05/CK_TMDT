package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.ProductApprovalItem;
import com.flower.server.dto.RejectProductForm;
import com.flower.server.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AdminProductApprovalService {

    private final JdbcTemplate jdbc;
    private final LogService logService;
    private final NotificationService notificationService;

    public AdminProductApprovalService(JdbcTemplate jdbc, LogService logService,
                                      NotificationService notificationService) {
        this.jdbc = jdbc;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ProductApprovalItem> list() {
        List<ProductApprovalItem> products = jdbc.query("""
                        SELECT p.id, p.partner_id, u.full_name AS partner_name, p.name, p.material,
                               p.description, p.price, p.discount_price,
                               p.thumbnail_url, p.status, p.reject_reason
                        FROM products p
                        JOIN users u ON u.id = p.partner_id
                        ORDER BY CASE p.status WHEN 'PENDING' THEN 0 ELSE 1 END, p.created_at DESC, p.id DESC
                        """,
                (rs, rowNum) -> new ProductApprovalItem(
                        rs.getLong("id"),
                        rs.getLong("partner_id"),
                        rs.getString("partner_name"),
                        rs.getString("name"),
                        rs.getString("material"),
                        rs.getString("description"),
                        rs.getBigDecimal("price"),
                        rs.getBigDecimal("discount_price"),
                        rs.getString("thumbnail_url"),
                        List.of(),
                        rs.getString("status"),
                        rs.getString("reject_reason")));

        return products.stream().map(product -> new ProductApprovalItem(
                product.id(), product.partnerId(), product.partnerName(), product.name(), product.material(),
                product.description(), product.price(), product.discountPrice(),
                product.thumbnailUrl(),
                jdbc.queryForList("SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order, id",
                        String.class, product.id()),
                product.status(), product.rejectReason())).toList();
    }

    @Transactional
    public void approve(User manager, Long productId) {
        Map<String, Object> product = findPendingProduct(productId);
        int updated = jdbc.update("""
                UPDATE products
                SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP, reject_reason = NULL
                WHERE id = ? AND status = 'PENDING'
                """, manager.getId(), productId);
        if (updated == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Sản phẩm không còn ở trạng thái chờ duyệt.");
        }

        Long partnerId = ((Number) product.get("partner_id")).longValue();
        String name = (String) product.get("name");
        logService.write(manager, "PRODUCT_APPROVE", "products", productId,
                "Duyệt sản phẩm \"" + name + "\" của Đối tác #" + partnerId + ".");
        notificationService.notify(partnerId, "PRODUCT_APPROVED", "Sản phẩm đã được duyệt",
                "Sản phẩm \"" + name + "\" đã được duyệt và hiện có thể hiển thị cho khách hàng.",
                "partner/products.html");
    }

    @Transactional
    public void reject(User manager, Long productId, RejectProductForm form) {
        String reason = form.reason().trim();
        if (reason.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do từ chối.");
        }

        Map<String, Object> product = findPendingProduct(productId);
        int updated = jdbc.update("""
                UPDATE products
                SET status = 'REJECTED', approved_by = NULL, approved_at = NULL, reject_reason = ?
                WHERE id = ? AND status = 'PENDING'
                """, reason, productId);
        if (updated == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Sản phẩm không còn ở trạng thái chờ duyệt.");
        }

        Long partnerId = ((Number) product.get("partner_id")).longValue();
        String name = (String) product.get("name");
        logService.write(manager, "PRODUCT_REJECT", "products", productId,
                "Từ chối sản phẩm \"" + name + "\". Lý do: " + reason);
        notificationService.notify(partnerId, "PRODUCT_REJECTED", "Sản phẩm cần được chỉnh sửa",
                "Sản phẩm \"" + name + "\" chưa được duyệt. Lý do: " + reason,
                "partner/products.html");
    }

    private Map<String, Object> findPendingProduct(Long productId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, partner_id, name FROM products WHERE id = ? AND status = 'PENDING' FOR UPDATE",
                productId);
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm đang chờ duyệt.");
        }
        return rows.get(0);
    }
}
