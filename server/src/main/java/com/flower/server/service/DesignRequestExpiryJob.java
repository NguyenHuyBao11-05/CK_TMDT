package com.flower.server.service;

import com.flower.server.entity.DesignQuote;
import com.flower.server.entity.DesignRequest;
import com.flower.server.entity.QuoteStatus;
import com.flower.server.entity.RequestStatus;
import com.flower.server.repository.DesignQuoteRepository;
import com.flower.server.repository.DesignRequestRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class DesignRequestExpiryJob {

    private final DesignRequestRepository requests;
    private final DesignQuoteRepository quotes;
    private final LogService logService;
    private final NotificationService notificationService;

    public DesignRequestExpiryJob(DesignRequestRepository requests, DesignQuoteRepository quotes,
                                  LogService logService, NotificationService notificationService) {
        this.requests = requests;
        this.quotes = quotes;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelayString = "${app.request-expire-check-ms}", initialDelay = 10000)
    @Transactional
    public void closeExpiredRequests() {
        for (DesignRequest request : requests.findByStatusAndDesiredDateBefore(RequestStatus.OPEN, LocalDateTime.now())) {
            request.setStatus(RequestStatus.CANCELLED);
            request.setSelectedQuoteId(null);

            for (DesignQuote quote : quotes.findByRequestId(request.getId())) {
                if (quote.getStatus() != QuoteStatus.REJECTED) {
                    quote.setStatus(QuoteStatus.REJECTED);
                    notificationService.notify(quote.getPartner().getId(), "REQUEST_EXPIRED",
                            "Yêu cầu #YC-" + request.getId() + " đã hết hạn",
                            "Yêu cầu \"" + request.getTitle() + "\" đã quá thời gian giao mà khách chưa xác nhận, báo giá của bạn không còn hiệu lực.",
                            "design/sent-quotes.html");
                }
            }
            notificationService.notify(request.getCustomer().getId(), "REQUEST_EXPIRED",
                    "Yêu cầu #YC-" + request.getId() + " đã hết hạn",
                    "Yêu cầu \"" + request.getTitle() + "\" đã quá thời gian giao mà chưa xác nhận đặt, hệ thống đã tự đóng yêu cầu.",
                    "design/my-requests.html");
            logService.write(null, "REQUEST_EXPIRE", "design_requests", request.getId(),
                    "Tự đóng yêu cầu #YC-" + request.getId() + " vì quá thời gian giao mà chưa xác nhận đặt.");
        }
    }
}
