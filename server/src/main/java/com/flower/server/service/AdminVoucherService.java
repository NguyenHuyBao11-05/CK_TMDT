package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.controller.AdminVoucherController;
import com.flower.server.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AdminVoucherService {
    private final JdbcTemplate jdbc;
    private final LogService logs;

    public AdminVoucherService(JdbcTemplate jdbc, LogService logs) {
        this.jdbc = jdbc;
        this.logs = logs;
    }

    public List<Map<String, Object>> list() {
        return jdbc.queryForList("SELECT * FROM vouchers ORDER BY created_at DESC, id DESC");
    }

    @Transactional
    public Map<String, Object> create(User actor, AdminVoucherController.VoucherForm form) {
        String code = normalizeCode(form.code());
        validateForm(form);
        Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM vouchers WHERE UPPER(code)=?", Integer.class, code);
        if (exists != null && exists > 0) throw new ApiException(HttpStatus.CONFLICT, "Mã voucher đã tồn tại.");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime validTo = now.plusYears(1);
        jdbc.update("""
            INSERT INTO vouchers(code,discount_type,discount_value,min_order_amount,max_discount_amount,
                valid_from,valid_to,usage_limit,used_count,status)
            VALUES(?,?,?,?,?,?,?,NULL,0,'ACTIVE')
            """, code, form.type(), form.value(), form.minOrder(), form.maxDiscount(),
                Timestamp.valueOf(now), Timestamp.valueOf(validTo));
        Long id = jdbc.query("SELECT id FROM vouchers WHERE code=?", rs -> rs.next() ? rs.getLong(1) : null, code);
        logs.write(actor, "VOUCHER_CREATE", "vouchers", id, "Tạo voucher " + code + ".");
        return Map.of("id", id, "code", code, "message", "Đã tạo voucher.");
    }

    @Transactional
    public Map<String, Object> update(User actor, long id, AdminVoucherController.VoucherForm form) {
        validateForm(form);
        String code = normalizeCode(form.code());
        Map<String, Object> old = findById(id);
        Integer duplicate = jdbc.queryForObject("SELECT COUNT(*) FROM vouchers WHERE UPPER(code)=? AND id<>?", Integer.class, code, id);
        if (duplicate != null && duplicate > 0) throw new ApiException(HttpStatus.CONFLICT, "Mã voucher đã tồn tại.");
        jdbc.update("""
            UPDATE vouchers SET code=?,discount_type=?,discount_value=?,min_order_amount=?,max_discount_amount=?
            WHERE id=?
            """, code, form.type(), form.value(), form.minOrder(), form.maxDiscount(), id);
        logs.write(actor, "VOUCHER_UPDATE", "vouchers", id, "Cập nhật voucher " + old.get("code") + " thành " + code + ".");
        return Map.of("id", id, "code", code, "message", "Đã cập nhật voucher.");
    }

    @Transactional
    public Map<String, Object> toggle(User actor, String rawCode) {
        Map<String, Object> voucher = findByCode(rawCode);
        String code = String.valueOf(voucher.get("code"));
        String next = "ACTIVE".equals(voucher.get("status")) ? "INACTIVE" : "ACTIVE";
        jdbc.update("UPDATE vouchers SET status=? WHERE id=?", next, voucher.get("id"));
        logs.write(actor, "VOUCHER_TOGGLE", "vouchers", ((Number) voucher.get("id")).longValue(),
                ("ACTIVE".equals(next) ? "Bật" : "Tắt") + " voucher " + code + ".");
        return Map.of("code", code, "status", next, "message", "ACTIVE".equals(next) ? "Đã bật voucher." : "Đã tắt voucher.");
    }

    @Transactional
    public Map<String, Object> delete(User actor, String rawCode) {
        Map<String, Object> voucher = findByCode(rawCode);
        Long id = ((Number) voucher.get("id")).longValue();
        String code = String.valueOf(voucher.get("code"));
        Integer usedByOrder = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE voucher_id=?", Integer.class, id);
        if (usedByOrder != null && usedByOrder > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Voucher đã được gắn với đơn hàng nên không thể xoá. Hãy tắt voucher thay thế.");
        }
        jdbc.update("DELETE FROM vouchers WHERE id=?", id);
        logs.write(actor, "VOUCHER_DELETE", "vouchers", id, "Xoá voucher " + code + ".");
        return Map.of("code", code, "message", "Đã xoá voucher.");
    }

    private Map<String, Object> findById(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM vouchers WHERE id=?", id);
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher.");
        return rows.get(0);
    }

    private Map<String, Object> findByCode(String rawCode) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM vouchers WHERE UPPER(code)=?", normalizeCode(rawCode));
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher.");
        return new LinkedHashMap<>(rows.get(0));
    }

    private static void validateForm(AdminVoucherController.VoucherForm form) {
        if ("PERCENT".equals(form.type()) && (form.value().compareTo(BigDecimal.ONE) < 0 || form.value().compareTo(new BigDecimal("100")) > 0)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phần trăm giảm phải từ 1 đến 100.");
        }
        if ("FIXED".equals(form.type()) && form.value().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số tiền giảm phải lớn hơn 0.");
        }
        if (form.minOrder().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn tối thiểu không được âm.");
        }
        if (form.maxDiscount() != null && form.maxDiscount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mức giảm tối đa phải lớn hơn 0.");
        }
    }

    private static String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    }
}
