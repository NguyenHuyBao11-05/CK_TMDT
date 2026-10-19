package com.flower.server.service;

import com.flower.server.common.ApiException;
import com.flower.server.dto.ForumItem;
import com.flower.server.dto.QuoteForm;
import com.flower.server.dto.SentQuoteItem;
import com.flower.server.entity.DesignQuote;
import com.flower.server.entity.DesignRequest;
import com.flower.server.entity.QuoteStatus;
import com.flower.server.entity.RequestStatus;
import com.flower.server.entity.User;
import com.flower.server.repository.DesignQuoteRepository;
import com.flower.server.repository.DesignRequestRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PartnerQuoteService {

    private final DesignRequestRepository requests;
    private final DesignQuoteRepository quotes;
    private final LogService logService;
    private final NotificationService notificationService;

    public PartnerQuoteService(DesignRequestRepository requests, DesignQuoteRepository quotes,
                               LogService logService, NotificationService notificationService) {
        this.requests = requests;
        this.quotes = quotes;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ForumItem> forum(User partner) {
        List<DesignRequest> list = requests.findByStatusAndDesiredDateAfterOrderByCreatedAtDesc(RequestStatus.OPEN, LocalDateTime.now());
        if (list.isEmpty()) {
            return List.of();
        }
        Map<Long, List<DesignQuote>> quotesByRequest = quotes
                .findByRequestIdInOrderByPriceAsc(list.stream().map(DesignRequest::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(q -> q.getRequest().getId()));

        return list.stream().map(r -> {
            List<DesignQuote> own = quotesByRequest.getOrDefault(r.getId(), List.of());
            DesignQuote mine = own.stream()
                    .filter(q -> q.getPartner().getId().equals(partner.getId()))
                    .findFirst()
                    .orElse(null);
            return new ForumItem(
                    r.getId(), shortName(r.getCustomer().getFullName()), r.getTitle(), r.getOccasion(),
                    r.getMaterialPreference(), r.getColorPreference(), r.getBudget(), r.getQuantity(), r.getDescription(),
                    r.getReferenceImageUrl(), r.getDesiredDate(), r.getCreatedAt(),
                    own.size(), r.getSelectedQuoteId() != null,
                    mine == null ? null : mine.getId(),
                    mine == null ? null : mine.getStatus().name());
        }).toList();
    }

    @Transactional
    public Long createQuote(User partner, Long requestId, QuoteForm form) {
        DesignRequest request = requests.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."));
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu này đã đóng, không nhận báo giá nữa.");
        }
        if (request.getSelectedQuoteId() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu đã có Đối tác được chọn.");
        }
        if (!request.getDesiredDate().isAfter(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu đã quá thời gian giao, không nhận báo giá nữa.");
        }
        if (quotes.existsByRequestIdAndPartnerId(requestId, partner.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đã gửi báo giá cho yêu cầu này rồi.");
        }

        DesignQuote quote = new DesignQuote();
        quote.setRequest(request);
        quote.setPartner(partner);
        quote.setPrice(form.price());
        quote.setEstimatedDays(form.estimatedDays());
        quote.setDescription(form.description().trim());
        quote.setSampleImageUrl(form.sampleImageUrl() == null || form.sampleImageUrl().isBlank() ? null : form.sampleImageUrl());
        try {
            quotes.saveAndFlush(quote);
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đã gửi báo giá cho yêu cầu này rồi.");
        }

        String price = String.format("%,d đ", form.price().longValue()).replace(',', '.');
        notificationService.notify(request.getCustomer().getId(), "QUOTE_NEW",
                "Có báo giá mới cho #YC-" + requestId,
                partner.getFullName() + " đã báo giá " + price + " cho yêu cầu \"" + request.getTitle() + "\".",
                "design/compare-quotes.html?id=" + requestId);
        logService.write(partner, "QUOTE_CREATE", "design_quotes", quote.getId(),
                "Gửi báo giá " + price + " cho yêu cầu #YC-" + requestId + ".");
        return quote.getId();
    }

    @Transactional(readOnly = true)
    public List<SentQuoteItem> myQuotes(User partner) {
        return quotes.findByPartnerIdOrderByCreatedAtDesc(partner.getId()).stream().map(q -> {
            DesignRequest r = q.getRequest();
            return new SentQuoteItem(
                    q.getId(), r.getId(), r.getTitle(), shortName(r.getCustomer().getFullName()), r.getReferenceImageUrl(),
                    r.getBudget(), r.getQuantity(), r.getDesiredDate(), r.getStatus().name(),
                    q.getPrice(), q.getEstimatedDays(), q.getDescription(), q.getSampleImageUrl(),
                    q.getStatus().name(), resultNote(q, r), q.getCreatedAt());
        }).toList();
    }

    private String resultNote(DesignQuote quote, DesignRequest request) {
        if (quote.getStatus() == QuoteStatus.SELECTED) {
            return request.getStatus() == RequestStatus.CONFIRMED
                    ? "Khách đã xác nhận đặt theo báo giá của bạn. Hãy chờ khách thanh toán rồi bắt đầu thực hiện."
                    : "Khách đang chọn báo giá của bạn và sẽ xác nhận đặt sớm.";
        }
        if (quote.getStatus() == QuoteStatus.REJECTED) {
            return request.getStatus() == RequestStatus.CANCELLED
                    ? "Khách đã huỷ yêu cầu này."
                    : "Khách đã chọn báo giá của shop khác.";
        }
        return "Khách đang xem và so sánh các báo giá. Bạn sẽ nhận được thông báo khi khách chọn.";
    }

    private static String shortName(String fullName) {
        String[] words = fullName.trim().split("\\s+");
        return String.join(" ", Arrays.copyOfRange(words, Math.max(0, words.length - 2), words.length));
    }
}
