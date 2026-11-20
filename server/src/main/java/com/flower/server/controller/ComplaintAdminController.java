package com.flower.server.controller;

import com.flower.server.dto.AdminComplaintItem;
import com.flower.server.dto.ResolveComplaintRequest;
import com.flower.server.service.ComplaintService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/complaints")
public class ComplaintAdminController {

    private final ComplaintService complaintService;

    public ComplaintAdminController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    public List<AdminComplaintItem> getComplaints() {
        return complaintService.getAdminComplaints();
    }

    @PostMapping("/{id}/resolve")
    public void resolveComplaint(@PathVariable Long id, @RequestBody ResolveComplaintRequest request) {
        complaintService.resolveComplaint(id, request.moderationNote());
    }

    @PostMapping("/{id}/rework")
    public void reworkComplaint(@PathVariable Long id, @RequestBody ResolveComplaintRequest request) {
        complaintService.reworkComplaint(id, request.moderationNote());
    }
}