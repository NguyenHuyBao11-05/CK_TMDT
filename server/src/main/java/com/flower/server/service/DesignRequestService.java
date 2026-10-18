package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.DesignRequestForm;
import com.flower.server.dto.MyRequestItem;
import com.flower.server.entity.DesignQuote;
import com.flower.server.entity.DesignRequest;
import com.flower.server.entity.QuoteStatus;
import com.flower.server.entity.RequestStatus;
import com.flower.server.entity.User;
import com.flower.server.repository.DesignQuoteRepository;
import com.flower.server.repository.DesignRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DesignRequestService {

    private final DesignRequestRepository requests;
    private final DesignQuoteRepository quotes;
    private final LogService logService;
    private final NotificationService notificationService;
    private final JdbcTemplate jdbc;

    public DesignRequestService(DesignRequestRepository requests, DesignQuoteRepository quotes, LogService logService,
                                NotificationService notificationService, JdbcTemplate jdbc) {
        this.requests = requests;
        this.quotes = quotes;
        this.logService = logService;
        this.notificationService = notificationService;
        this.jdbc = jdbc;
    }

    @Transactional
    public Long create(User customer, DesignRequestForm form) {
        if (form.desiredDate().isBefore(LocalDateTime.now().plusDays(1).minusMinutes(5))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Thời gian nhận hoa phải sau hiện tại ít nhất 1 ngày.");
        }

        DesignRequest request = new DesignRequest();
        request.setCustomer(customer);
        request.setTitle(form.title().trim());
        request.setOccasion(form.occasion().trim());
        request.setMaterialPreference(form.materialPreference().trim());
        request.setColorPreference(form.colorPreference().trim());
        request.setBudget(form.budget());
        request.setQuantity(form.quantity());
        request.setDescription(form.description().trim());
        request.setReferenceImageUrl(form.referenceImageUrl() == null || form.referenceImageUrl().isBlank() ? null : form.referenceImageUrl());
        request.setDesiredDate(form.desiredDate());
        requests.save(request);

        logService.write(customer, "REQUEST_CREATE", "design_requests", request.getId(),
                "Đăng yêu cầu thiết kế \"" + request.getTitle() + "\".");
        return request.getId();
    }

    @Transactional(readOnly = true)
    public List<MyRequestItem> mine(User customer) {
        List<DesignRequest> list = requests.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        if (list.isEmpty()) {
            return List.of();
        }
        Map<Long, List<DesignQuote>> quotesByRequest = quotes
                .findByRequestIdInOrderByPriceAsc(list.stream().map(DesignRequest::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(q -> q.getRequest().getId()));

        return list.stream().map(r -> {
            List<DesignQuote> own = quotesByRequest.getOrDefault(r.getId(), List.of());
            DesignQuote selected = own.stream()
                    .filter(q -> q.getId().equals(r.getSelectedQuoteId()))
                    .findFirst()
                    .orElse(null);
            return new MyRequestItem(
                    r.getId(), r.getTitle(), r.getOccasion(), r.getMaterialPreference(), r.getColorPreference(),
                    r.getBudget(), r.getQuantity(), r.getDescription(), r.getReferenceImageUrl(), r.getDesiredDate(),
                    r.getStatus().name(), r.getCreatedAt(),
                    own.size(),
                    own.isEmpty() ? null : own.get(0).getPrice(),
                    own.stream().map(q -> q.getPartner().getFullName()).toList(),
                    r.getSelectedQuoteId(),
                    selected == null ? null : selected.getPartner().getFullName(),
                    selected == null ? null : selected.getPrice(),
                    orderStatus(r));
        }).toList();
    }

    @Transactional
    public void cancel(User customer, Long id) {
        DesignRequest request = requests.findById(id)
                .filter(r -> r.getCustomer().getId().equals(customer.getId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."));
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ huỷ được yêu cầu đang mở.");
        }

        request.setStatus(RequestStatus.CANCELLED);
        request.setSelectedQuoteId(null);
        for (DesignQuote quote : quotes.findByRequestId(id)) {
            quote.setStatus(QuoteStatus.REJECTED);
            notificationService.notify(quote.getPartner().getId(), "REQUEST_CANCELLED",
                    "Yêu cầu #YC-" + id + " đã bị huỷ",
                    "Khách hàng đã huỷ yêu cầu \"" + request.getTitle() + "\", báo giá của bạn không còn hiệu lực.",
                    "design/sent-quotes.html");
        }
        logService.write(customer, "REQUEST_CANCEL", "design_requests", id,
                "Huỷ yêu cầu thiết kế \"" + request.getTitle() + "\".");
    }

    private String orderStatus(DesignRequest request) {
        if (request.getStatus() != RequestStatus.CONFIRMED) {
            return null;
        }
        List<String> rows = jdbc.queryForList(
                "SELECT status FROM orders WHERE design_request_id = ? ORDER BY id DESC LIMIT 1", String.class, request.getId());
        return rows.isEmpty() ? null : rows.get(0);
    }
}
