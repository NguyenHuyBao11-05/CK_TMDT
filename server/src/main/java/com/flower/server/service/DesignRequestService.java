package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.DesignRequestForm;
import com.flower.server.dto.MyRequestItem;
import com.flower.server.dto.QuoteItem;
import com.flower.server.dto.QuotePayment;
import com.flower.server.dto.RequestDetail;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
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

    @Transactional(readOnly = true)
    public RequestDetail detail(User customer, Long id) {
        DesignRequest r = findOwned(customer, id);
        List<QuoteItem> list = quotes.findByRequestId(id).stream()
                .sorted(Comparator.comparing(DesignQuote::getPrice))
                .map(QuoteItem::from)
                .toList();
        return new RequestDetail(
                r.getId(), r.getTitle(), r.getOccasion(), r.getMaterialPreference(), r.getColorPreference(),
                r.getBudget(), r.getQuantity(), r.getDescription(), r.getReferenceImageUrl(), r.getDesiredDate(),
                r.getStatus().name(), r.getCreatedAt(), r.getSelectedQuoteId(), orderStatus(r), list);
    }

    @Transactional
    public void select(User customer, Long id, Long quoteId) {
        DesignRequest request = findOwned(customer, id);
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu này không còn nhận chọn báo giá.");
        }
        List<DesignQuote> list = quotes.findByRequestId(id);
        DesignQuote chosen = list.stream()
                .filter(q -> q.getId().equals(quoteId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo giá."));
        if (chosen.getStatus() == QuoteStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Báo giá này không còn hiệu lực.");
        }
        for (DesignQuote quote : list) {
            if (quote.getStatus() == QuoteStatus.SELECTED) {
                quote.setStatus(QuoteStatus.PENDING);
            }
        }
        chosen.setStatus(QuoteStatus.SELECTED);
        request.setSelectedQuoteId(chosen.getId());
        logService.write(customer, "QUOTE_SELECT", "design_quotes", chosen.getId(),
                "Chọn báo giá " + money(chosen.getPrice()) + " của " + chosen.getPartner().getFullName()
                        + " cho yêu cầu #YC-" + id + ".");
    }

    @Transactional
    public Long confirm(User customer, Long id) {
        DesignRequest request = findOwned(customer, id);
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu này đã được xác nhận hoặc đã huỷ.");
        }
        if (request.getSelectedQuoteId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng chọn 1 báo giá trước khi xác nhận.");
        }

        request.setStatus(RequestStatus.CONFIRMED);
        for (DesignQuote quote : quotes.findByRequestId(id)) {
            if (quote.getId().equals(request.getSelectedQuoteId())) {
                notificationService.notify(quote.getPartner().getId(), "QUOTE_SELECTED",
                        "Báo giá cho #YC-" + id + " đã được chọn",
                        "Khách hàng đã chọn báo giá " + money(quote.getPrice()) + " của bạn cho yêu cầu \"" + request.getTitle() + "\".",
                        "design/sent-quotes.html");
            } else if (quote.getStatus() != QuoteStatus.REJECTED) {
                quote.setStatus(QuoteStatus.REJECTED);
                notificationService.notify(quote.getPartner().getId(), "QUOTE_REJECTED",
                        "Báo giá cho #YC-" + id + " không được chọn",
                        "Khách hàng đã chọn Đối tác khác cho yêu cầu \"" + request.getTitle() + "\".",
                        "design/sent-quotes.html");
            }
        }
        logService.write(customer, "REQUEST_CONFIRM", "design_requests", id,
                "Xác nhận đặt yêu cầu #YC-" + id + " theo báo giá #" + request.getSelectedQuoteId() + ".");
        return request.getSelectedQuoteId();
    }

    @Transactional(readOnly = true)
    public QuotePayment quotePayment(User customer, Long quoteId) {
        DesignQuote quote = quotes.findById(quoteId)
                .filter(q -> q.getRequest().getCustomer().getId().equals(customer.getId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo giá."));
        DesignRequest request = quote.getRequest();
        if (request.getStatus() != RequestStatus.CONFIRMED || quote.getStatus() != QuoteStatus.SELECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Báo giá này chưa được xác nhận đặt.");
        }
        QuotePayment.Line line = new QuotePayment.Line(
                null, quote.getId(), request.getId(), quote.getPartner().getId(),
                "Thiết kế riêng: " + request.getTitle(),
                request.getQuantity() + " bó theo yêu cầu #YC-" + request.getId(),
                quote.getPartner().getFullName(),
                quote.getSampleImageUrl() != null ? quote.getSampleImageUrl() : request.getReferenceImageUrl(),
                quote.getPrice(), 1);
        return new QuotePayment(List.of(line), quote.getPrice(), null, BigDecimal.ZERO, quote.getPrice());
    }

    @Transactional
    public void cancel(User customer, Long id) {
        DesignRequest request = findOwned(customer, id);
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

    private DesignRequest findOwned(User customer, Long id) {
        return requests.findById(id)
                .filter(r -> r.getCustomer().getId().equals(customer.getId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."));
    }

    private static String money(BigDecimal amount) {
        return String.format("%,d đ", amount.longValue()).replace(',', '.');
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
