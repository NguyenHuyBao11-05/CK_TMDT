
package com.flower.server.controller;

import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.RecommendationService;
import com.flower.server.service.ShoppingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
public class ShoppingController {

    private final ShoppingService service;
    private final CurrentUserService currentUser;
    private final RecommendationService recommender;

    public ShoppingController(
            ShoppingService service,
            CurrentUserService currentUser,
            RecommendationService recommender
    ) {
        this.service = service;
        this.currentUser = currentUser;
        this.recommender = recommender;
    }

    // ==================== PRODUCTS ====================

    @GetMapping("/api/products")
    public List<Map<String, Object>> products(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String materials,
            @RequestParam(required = false) BigDecimal min,
            @RequestParam(required = false) BigDecimal max,
            @RequestParam(defaultValue = "popular") String sort,
            @RequestParam(defaultValue = "0") int page
    ) {
        return service.products(q, materials, min, max, sort, page);
    }

    @GetMapping("/api/products/best-sellers")
    public List<Map<String, Object>> bestSellers() {
        return service.bestSellers();
    }

    @GetMapping("/api/products/new")
    public List<Map<String, Object>> newProducts() {
        return service.newProducts();
    }

    @GetMapping("/api/products/{id}")
    public Map<String, Object> product(@PathVariable long id) {
        return service.product(id);
    }

    @GetMapping("/api/products/{id}/reviews")
    public List<Map<String, Object>> reviews(@PathVariable long id) {
        return service.reviews(id);
    }

    @GetMapping("/api/products/{id}/comments")
    public List<Map<String, Object>> comments(@PathVariable long id) {
        service.product(id);
        return service.comments(id);
    }

    @GetMapping("/api/products/{id}/comments/can-comment")
    public Map<String, Boolean> canComment(@PathVariable long id) {
        User user = currentUser.require(Role.CUSTOMER);
        return Map.of("can_comment", service.canComment(user, id));
    }

    @PostMapping("/api/products/{id}/comments")
    public Map<String, String> addComment(
            @PathVariable long id,
            @Valid @RequestBody CommentForm form
    ) {
        service.addComment(
                currentUser.require(Role.CUSTOMER),
                id,
                form.content()
        );

        return Map.of("message", "Đã gửi bình luận.");
    }

    @GetMapping("/api/products/{id}/related")
    public List<Map<String, Object>> related(@PathVariable long id) {
        service.product(id);

        List<Map<String, Object>> list = recommender.similar(id);

        return list.isEmpty() ? service.related(id) : list;
    }

    @GetMapping("/api/products/recommendations")
    public List<Map<String, Object>> recommendations() {
        User user = currentUser.require(Role.CUSTOMER);

        List<Map<String, Object>> list =
                recommender.forCustomer(user.getId());

        return list.isEmpty() ? service.recommendations(user) : list;
    }

    // ==================== CART ====================

    @GetMapping("/api/cart")
    public Map<String, Object> cart() {
        return service.cart(currentUser.require(Role.CUSTOMER));
    }

    @PostMapping("/api/cart/items")
    public Map<String, Object> addCart(
            @Valid @RequestBody CartItemForm form
    ) {
        return service.addCartItem(
                currentUser.require(Role.CUSTOMER),
                form.productId(),
                form.quantity(),
                form.note()
        );
    }

    @PutMapping("/api/cart/items/{productId}")
    public Map<String, Object> setCart(
            @PathVariable long productId,
            @Valid @RequestBody QuantityForm form
    ) {
        return service.setCartQuantity(
                currentUser.require(Role.CUSTOMER),
                productId,
                form.quantity()
        );
    }

    @DeleteMapping("/api/cart/items/{productId}")
    public Map<String, Object> deleteCart(
            @PathVariable long productId
    ) {
        return service.deleteCartItem(
                currentUser.require(Role.CUSTOMER),
                productId
        );
    }

    // ==================== VOUCHERS ====================

    @PostMapping("/api/vouchers/validate")
    public Map<String, Object> validateVoucher(
            @Valid @RequestBody VoucherForm form
    ) {
        return service.validateVoucher(
                currentUser.require(Role.CUSTOMER),
                form.code()
        );
    }

    // ==================== ORDERS ====================

    @PostMapping("/api/orders")
    public Map<String, Object> createOrder(
            @RequestBody Map<String, Object> body
    ) {
        return service.createOrder(
                currentUser.require(Role.CUSTOMER),
                body
        );
    }

    @PostMapping("/api/orders/{code}/pay")
    public Map<String, Object> pay(@PathVariable String code) {
        return service.pay(
                currentUser.require(Role.CUSTOMER),
                code
        );
    }

    @PostMapping("/api/orders/{code}/cash")
    public Map<String, Object> cash(@PathVariable String code) {
        return service.placeCashOrder(
                currentUser.require(Role.CUSTOMER),
                code
        );
    }

    @PostMapping("/api/orders/{code}/vnpay")
    public Map<String, Object> vnpay(
            @PathVariable String code,
            HttpServletRequest request
    ) {
        return service.startVnpayPayment(
                currentUser.require(Role.CUSTOMER),
                code,
                request.getRemoteAddr()
        );
    }

    @GetMapping("/api/orders/by-code/{code}")
    public Map<String, Object> order(@PathVariable String code) {
        return service.orderByCode(
                code,
                currentUser.require(Role.CUSTOMER)
        );
    }

    @PostMapping("/api/orders/{code}/invoice")
    public Map<String, Object> invoice(
            @PathVariable String code,
            @Valid @RequestBody InvoiceForm form
    ) {
        return service.sendInvoice(
                currentUser.require(Role.CUSTOMER),
                code,
                form.email()
        );
    }

    // ==================== VNPAY ====================

    /**
     * VNPAY gọi IPN để thông báo kết quả thanh toán.
     */
    @GetMapping("/api/payments/vnpay/ipn")
    public Map<String, Object> vnpayIpn(
            @RequestParam Map<String, String> params
    ) {
        return service.processVnpayIpn(params);
    }

    /**
     * VNPAY chuyển trình duyệt khách hàng về sau thanh toán.
     */
    @GetMapping("/api/payments/vnpay/return")
    public ResponseEntity<Void> vnpayReturn(
            @RequestParam Map<String, String> params
    ) {
        String redirectUrl = service.vnpayReturnRedirect(params);

        return ResponseEntity
                .status(302)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build();
    }

    // ==================== REQUEST FORMS ====================

    public record CommentForm(
            @NotBlank(message = "Nội dung bình luận không được để trống.")
            @Size(
                    min = 5,
                    max = 1000,
                    message = "Bình luận phải từ 5 đến 1000 ký tự."
            )
            String content
    ) {}

    public record CartItemForm(
            @Min(value = 1, message = "Số lượng phải từ 1 trở lên.")
            long productId,

            @Min(value = 1, message = "Số lượng phải từ 1 trở lên.")
            int quantity,

            @Size(max = 300, message = "Ghi chú tối đa 300 ký tự.")
            String note
    ) {}

    public record QuantityForm(
            @Min(value = 1, message = "Số lượng phải từ 1 trở lên.")
            int quantity
    ) {}

    public record VoucherForm(
            @NotBlank(message = "Vui lòng nhập mã voucher.")
            String code
    ) {}

    public record InvoiceForm(
            @NotBlank(message = "Email không được để trống.")
            String email
    ) {}
}
