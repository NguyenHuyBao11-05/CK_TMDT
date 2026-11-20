package com.flower.server.controller;

import com.flower.server.dto.CreateComplaintRequest;
import com.flower.server.dto.CreateComplaintResponse;
import com.flower.server.dto.CanComplaintOrder;
import com.flower.server.dto.MyComplaintItem;
import com.flower.server.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Validated
public class ComplaintController {
    private final ComplaintService complaintService;

    @GetMapping("/can-complaint-orders")
    public List<CanComplaintOrder> getCanComplaintOrders() {
        return complaintService.getCanComplaintOrders();
    }

    @PostMapping
    public CreateComplaintResponse create(@Valid @RequestBody CreateComplaintRequest request) {
        return complaintService.createComplaint(request);
    }

    @GetMapping("/mine")
    public List<MyComplaintItem> mine() {
        return complaintService.getMyComplaints();
    }
}