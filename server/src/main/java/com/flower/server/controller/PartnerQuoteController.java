package com.flower.server.controller;

import com.flower.server.dto.ForumItem;
import com.flower.server.dto.QuoteForm;
import com.flower.server.dto.SentQuoteItem;
import com.flower.server.entity.Role;
import com.flower.server.service.CurrentUserService;
import com.flower.server.service.PartnerQuoteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner")
public class PartnerQuoteController {

    private final PartnerQuoteService service;
    private final CurrentUserService currentUser;

    public PartnerQuoteController(PartnerQuoteService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping("/forum")
    public List<ForumItem> forum() {
        return service.forum(currentUser.require(Role.PARTNER));
    }

    @PostMapping("/forum/{id}/quotes")
    public Map<String, Long> createQuote(@PathVariable Long id, @Valid @RequestBody QuoteForm form) {
        return Map.of("id", service.createQuote(currentUser.require(Role.PARTNER), id, form));
    }

    @GetMapping("/quotes")
    public List<SentQuoteItem> myQuotes() {
        return service.myQuotes(currentUser.require(Role.PARTNER));
    }
}
