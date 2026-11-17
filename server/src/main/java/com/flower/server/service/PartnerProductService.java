package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.PartnerProductForm;
import com.flower.server.dto.ProductApprovalItem;
import com.flower.server.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class PartnerProductService {

    private final JdbcTemplate jdbc;
    private final LogService logService;
    private final NotificationService notificationService;

    public PartnerProductService(JdbcTemplate jdbc, LogService logService,
                                 NotificationService notificationService) {
        this.jdbc = jdbc;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ProductApprovalItem> mine(User partner) {
        List<ProductApprovalItem> products = jdbc.query("""
                        SELECT id, partner_id, name, material, description, price, discount_price,
                               thumbnail_url,
                               CASE WHEN status = 'REJECTED' AND LEFT(reject_reason, 14) = '~ADMIN_HIDDEN~'
                                    THEN 'HIDDEN' ELSE status END AS status,
                               CASE WHEN status = 'REJECTED' AND LEFT(reject_reason, 14) = '~ADMIN_HIDDEN~'
                                    THEN SUBSTRING(reject_reason, 15) ELSE reject_reason END AS reject_reason
                        FROM products
                        WHERE partner_id = ?
                        ORDER BY created_at DESC, id DESC
                        """,
                (rs, rowNum) -> new ProductApprovalItem(
                        rs.getLong("id"),
                        rs.getLong("partner_id"),
                        partner.getFullName(),
                        rs.getString("name"),
                        rs.getString("material"),
                        rs.getString("description"),
                        rs.getBigDecimal("price"),
                        rs.getBigDecimal("discount_price"),
                        rs.getString("thumbnail_url"),
                        List.of(),
                        rs.getString("status"),
                        rs.getString("reject_reason")), partner.getId());
        return products.stream().map(product -> new ProductApprovalItem(
                product.id(), product.partnerId(), product.partnerName(), product.name(), product.material(),
                product.description(), product.price(), product.discountPrice(),
                product.thumbnailUrl(),
                jdbc.queryForList(
                        "SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order, id",
                        String.class, product.id()),
                product.status(), product.rejectReason())).toList();
    }

    @Transactional
    public Long create(User partner, PartnerProductForm form) {
        validateForm(form);
        List<String> imageUrls = cleanImageUrls(form.imageUrls());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        PreparedStatementCreator statementCreator = connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO products
                        (partner_id, name, material, description, price, discount_price,
                         thumbnail_url, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, partner.getId());
            statement.setString(2, form.name().trim());
            statement.setString(3, form.material());
            statement.setString(4, blankToNull(form.description()));
            statement.setBigDecimal(5, form.price());
            statement.setBigDecimal(6, form.discountPrice());
            statement.setString(7, imageUrls.get(0));
            return statement;
        };
        jdbc.update(statementCreator, keyHolder);
        Long productId = keyHolder.getKey().longValue();
        saveImages(productId, imageUrls);

        logService.write(partner, "PRODUCT_CREATE", "products", productId,
                "Tạo sản phẩm \"" + form.name().trim() + "\" ở trạng thái chờ duyệt.");
        notifyManagers(partner, productId, form.name().trim());
        return productId;
    }

    @Transactional
    public void update(User partner, Long productId, PartnerProductForm form) {
        validateForm(form);
        Map<String, Object> current = jdbc.queryForMap("""
                SELECT name, material, description, price, discount_price,
                       thumbnail_url, status
                FROM products
                WHERE id = ? AND partner_id = ?
                FOR UPDATE
                """, productId, partner.getId());
        List<String> oldImages = jdbc.queryForList(
                "SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order, id",
                String.class, productId);
        List<String> imageUrls = cleanImageUrls(form.imageUrls());

        boolean reviewedContentChanged = !Objects.equals(current.get("name"), form.name().trim())
                || !Objects.equals(current.get("material"), form.material())
                || !Objects.equals(current.get("description"), blankToNull(form.description()))
                || !sameMoney(current.get("price"), form.price())
                || !sameMoney(current.get("discount_price"), form.discountPrice())
                || !oldImages.equals(imageUrls)
                || !Objects.equals(current.get("thumbnail_url"), imageUrls.get(0));
        String currentStatus = (String) current.get("status");
        String status = reviewedContentChanged && !"PENDING".equals(currentStatus)
                ? "PENDING"
                : currentStatus;

        jdbc.update("""
                UPDATE products
                SET name = ?, material = ?, description = ?, price = ?, discount_price = ?,
                    thumbnail_url = ?, status = ?,
                    approved_by = CASE WHEN ? = 'PENDING' THEN NULL ELSE approved_by END,
                    approved_at = CASE WHEN ? = 'PENDING' THEN NULL ELSE approved_at END,
                    reject_reason = CASE WHEN ? = 'PENDING' THEN NULL ELSE reject_reason END
                WHERE id = ? AND partner_id = ?
                """,
                form.name().trim(), form.material(), blankToNull(form.description()), form.price(),
                form.discountPrice(), imageUrls.get(0), status,
                status, status, status, productId, partner.getId());
        jdbc.update("DELETE FROM product_images WHERE product_id = ?", productId);
        saveImages(productId, imageUrls);

        logService.write(partner, "PRODUCT_UPDATE", "products", productId,
                "Cập nhật sản phẩm \"" + form.name().trim() + "\""
                        + (reviewedContentChanged && !"PENDING".equals(current.get("status"))
                        ? ", chuyển về chờ duyệt." : "."));
        if ("PENDING".equals(status) && reviewedContentChanged) {
            notifyManagers(partner, productId, form.name().trim());
        }
    }

    private void validateForm(PartnerProductForm form) {
        if (form.price() != null && form.discountPrice() != null
                && form.discountPrice().compareTo(form.price()) >= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Giá ưu đãi phải nhỏ hơn giá bán.");
        }
        cleanImageUrls(form.imageUrls());
    }

    private List<String> cleanImageUrls(List<String> urls) {
        if (urls == null || urls.isEmpty() || urls.size() > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Sản phẩm cần có từ 1 đến 5 ảnh.");
        }
        List<String> cleaned = new ArrayList<>();
        for (String url : urls) {
            String value = url == null ? "" : url.trim();
            if (!value.startsWith("/uploads/") || value.length() > 500) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Ảnh sản phẩm phải được tải lên hệ thống.");
            }
            if (cleaned.contains(value)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Không được thêm trùng ảnh sản phẩm.");
            }
            cleaned.add(value);
        }
        return cleaned;
    }

    private void saveImages(Long productId, List<String> imageUrls) {
        for (int i = 0; i < imageUrls.size(); i++) {
            jdbc.update("INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
                    productId, imageUrls.get(i), i);
        }
    }

    private void notifyManagers(User partner, Long productId, String productName) {
        List<Long> managers = jdbc.queryForList("SELECT id FROM users WHERE role = 'MANAGER'", Long.class);
        for (Long managerId : managers) {
            notificationService.notify(managerId, "PRODUCT_PENDING", "Sản phẩm cần kiểm duyệt",
                    partner.getFullName() + " đã gửi sản phẩm \"" + productName + "\" để duyệt.",
                    "admin/product-approvals.html");
        }
    }

    private static boolean sameMoney(Object current, java.math.BigDecimal submitted) {
        if (current == null || submitted == null) return current == null && submitted == null;
        return ((java.math.BigDecimal) current).compareTo(submitted) == 0;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
