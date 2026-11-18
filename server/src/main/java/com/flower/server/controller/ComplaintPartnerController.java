package com.flower.server.controller;

import com.flower.server.dto.PartnerComplaintItem;
import com.flower.server.dto.PartnerComplaintResponseRequest;
import com.flower.server.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partner/complaints")
public class ComplaintPartnerController {
    private final ComplaintService complaintService;
    public ComplaintPartnerController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    public List<PartnerComplaintItem> getComplaints() {
        return complaintService.getPartnerComplaints();
    }

    @PostMapping("/{id}/respond")
    public void respond(@PathVariable Long id, @Valid @RequestBody PartnerComplaintResponseRequest request) {
        complaintService.respondToComplaint(id, request);
    }
}