package com.flower.server.controller;

import com.flower.server.dto.*;
import com.flower.server.service.UserOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Validated
public class UserOrderController {

    private final UserOrderService orderService;

    @GetMapping("/mine")
    public List<UserOrderItem> mine(@RequestParam(required = false) String status) {
        return orderService.getMyOrders(status);
    }

    @GetMapping("/{id}")
    public OrderDetail getOrderDetail(@PathVariable Long id) {
        return orderService.getOrderDetail(id);
    }

    @PostMapping("/{id}/cancel")
    public UserOrderCancelResponse cancelOrder(@PathVariable Long id, @RequestBody UserOrderCancelRequest request) {
        return orderService.cancelOrder(id, request);
    }

    @PostMapping("/{id}/received")
    public UserOrderReceiveResponse receivedOrder(@PathVariable Long id) {
        return orderService.receivedOrder(id);
    }

    @PostMapping("/{id}/review")
    public CreateReviewResponse createReview(@PathVariable Long id, @Valid @RequestBody CreateReviewRequest request) {
        return orderService.createReview(id, request);
    }
}
