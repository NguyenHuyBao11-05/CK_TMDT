package com.flower.server.controller;

import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.service.AdminVoucherService;
import com.flower.server.service.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/vouchers")
public class AdminVoucherController {

    private final AdminVoucherService service;
    private final CurrentUserService currentUser;

    public AdminVoucherController(
            AdminVoucherService service,
            CurrentUserService currentUser
    ) {
        this.service = service;
        this.currentUser = currentUser;
    }


    @GetMapping
    public List<Map<String, Object>> list() {
        currentUser.require(Role.MANAGER);
        return service.list();
    }

    @PostMapping
    public Map<String, Object> create(
            @Valid @RequestBody VoucherForm form
    ) {
        User actor = currentUser.require(Role.MANAGER);
        return service.create(actor, form);
    }


    @PutMapping("/{id}")
    public Map<String, Object> update(
            @PathVariable long id,
            @Valid @RequestBody VoucherForm form
    ) {
        User actor = currentUser.require(Role.MANAGER);
        return service.update(actor, id, form);
    }


    @PostMapping("/code/{code}/toggle")
    public Map<String, Object> toggle(
            @PathVariable String code
    ) {
        User actor = currentUser.require(Role.MANAGER);
        return service.toggle(actor, code);
    }

    @DeleteMapping("/code/{code}")
    public Map<String, Object> delete(
            @PathVariable String code
    ) {
        User actor = currentUser.require(Role.MANAGER);
        return service.delete(actor, code);
    }


    public record VoucherForm(

            @NotBlank(message = "Vui lòng nhập mã voucher.")
            @Pattern(
                    regexp = "[A-Za-z0-9]{3,20}",
                    message = "Mã voucher gồm 3–20 ký tự chữ hoặc số."
            )
            String code,

            @NotBlank(message = "Vui lòng chọn loại giảm giá.")
            @Pattern(
                    regexp = "PERCENT|FIXED",
                    message = "Loại voucher phải là PERCENT hoặc FIXED."
            )
            String type,

            @NotNull(message = "Vui lòng nhập giá trị giảm.")
            @DecimalMin(
                    value = "0.01",
                    message = "Giá trị giảm phải lớn hơn 0."
            )
            BigDecimal value,

            @NotNull(message = "Vui lòng nhập đơn tối thiểu.")
            @DecimalMin(
                    value = "0",
                    message = "Đơn tối thiểu không được âm."
            )
            BigDecimal minOrder,

            BigDecimal maxDiscount
    ) {
    }
}