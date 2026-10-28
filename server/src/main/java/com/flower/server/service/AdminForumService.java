package com.flower.server.service;

import com.flower.server.common.ApiException;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AdminForumService {

    private static final Set<String> STATUSES = Set.of("OPEN", "CONFIRMED", "CANCELLED");

    private final JdbcTemplate jdbc;
    private final DesignRequestRepository requests;
    private final DesignQuoteRepository quotes;
    private final LogService logService;
    private final NotificationService notificationService;

    public AdminForumService(JdbcTemplate jdbc, DesignRequestRepository requests, DesignQuoteRepository quotes,
                             LogService logService, NotificationService notificationService) {
        this.jdbc = jdbc;
        this.requests = requests;
        this.quotes = quotes;
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> list(String status, String visibility, String q, int page, int size) {
        StringBuilder where = new StringBuilder("1 = 1");
        List<Object> args = new ArrayList<>();
        if (status != null && STATUSES.contains(status)) {
            where.append(" AND r.status = ?");
            args.add(status);
        }
        if ("hidden".equals(visibility)) {
            where.append(" AND (r.hidden_at IS NOT NULL OR EXISTS (SELECT 1 FROM design_quotes hq WHERE hq.request_id = r.id AND hq.hidden_at IS NOT NULL))");
        } else if ("visible".equals(visibility)) {
            where.append(" AND r.hidden_at IS NULL");
        }
        if (q != null && !q.isBlank()) {
            String keyword = q.trim();
            String digits = keyword.replaceAll("\\D", "");
            where.append(" AND (r.title LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?");
            args.add("%" + keyword + "%");
            args.add("%" + keyword + "%");
            args.add("%" + keyword + "%");
            if (!digits.isEmpty() && digits.length() < 18) {
                where.append(" OR r.id = ?");
                args.add(Long.parseLong(digits));
            }
            where.append(")");
        }

        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM design_requests r JOIN users u ON u.id = r.customer_id WHERE " + where,
                Long.class, args.toArray());
        long totalItems = total == null ? 0 : total;

        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(size);
        pageArgs.add(page * size);
        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT r.id, r.title, r.occasion, r.budget, r.quantity, r.desired_date, r.status, r.created_at,
                       r.hidden_reason, r.hidden_at, u.full_name AS customer_name, u.email AS customer_email,
                       (SELECT COUNT(*) FROM design_quotes q WHERE q.request_id = r.id) AS quote_count,
                       (SELECT COUNT(*) FROM design_quotes q WHERE q.request_id = r.id AND q.hidden_at IS NOT NULL) AS hidden_quote_count
                FROM design_requests r
                JOIN users u ON u.id = r.customer_id
                WHERE %s
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT ? OFFSET ?
                """.formatted(where), pageArgs.toArray());

        Map<String, Object> stats = jdbc.queryForMap("""
                SELECT COUNT(*) AS total,
                       COALESCE(SUM(status = 'OPEN' AND hidden_at IS NULL), 0) AS open,
                       COALESCE(SUM(hidden_at IS NOT NULL), 0) AS hidden_requests,
                       (SELECT COUNT(*) FROM design_quotes WHERE hidden_at IS NOT NULL) AS hidden_quotes
                FROM design_requests
                """);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", page);
        result.put("total_pages", (int) Math.ceil((double) totalItems / size));
        result.put("total_items", totalItems);
        result.put("stats", stats);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detail(Long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT r.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
                       (SELECT o.order_code FROM orders o WHERE o.design_request_id = r.id ORDER BY o.id DESC LIMIT 1) AS order_code,
                       (SELECT o.status FROM orders o WHERE o.design_request_id = r.id ORDER BY o.id DESC LIMIT 1) AS order_status
                FROM design_requests r
                JOIN users u ON u.id = r.customer_id
                WHERE r.id = ?
                """, id);
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu.");
        }
        Map<String, Object> result = new LinkedHashMap<>(rows.get(0));
        result.put("quotes", jdbc.queryForList("""
                SELECT q.id, q.price, q.estimated_days, q.description, q.sample_image_url, q.status,
                       q.hidden_reason, q.hidden_at, q.created_at, u.full_name AS partner_name, u.email AS partner_email
                FROM design_quotes q
                JOIN users u ON u.id = q.partner_id
                WHERE q.request_id = ?
                ORDER BY q.price, q.id
                """, id));
        return result;
    }

    @Transactional
    public void hideRequest(User manager, Long id, String reason) {
        DesignRequest request = findRequest(id);
        if (request.getHiddenAt() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu này đang bị ẩn rồi.");
        }
        if (request.getStatus() == RequestStatus.CONFIRMED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu đã được chốt thành đơn hàng, không thể ẩn.");
        }
        request.setHiddenReason(reason.trim());
        request.setHiddenAt(LocalDateTime.now());

        notificationService.notify(request.getCustomer().getId(), "REQUEST_HIDDEN",
                "Yêu cầu #YC-" + id + " đã bị ẩn",
                "Yêu cầu \"" + request.getTitle() + "\" đã bị ẩn khỏi diễn đàn. Lý do: " + request.getHiddenReason(),
                "design/my-requests.html");
        for (DesignQuote quote : quotes.findByRequestId(id)) {
            if (quote.getHiddenAt() == null && quote.getStatus() != QuoteStatus.REJECTED) {
                notificationService.notify(quote.getPartner().getId(), "REQUEST_HIDDEN",
                        "Yêu cầu #YC-" + id + " đã bị ẩn",
                        "Yêu cầu \"" + request.getTitle() + "\" đã bị Quản lý ẩn khỏi diễn đàn, tạm thời không thể tiếp tục.",
                        "design/sent-quotes.html");
            }
        }
        logService.write(manager, "REQUEST_HIDE", "design_requests", id,
                "Ẩn yêu cầu #YC-" + id + " \"" + request.getTitle() + "\". Lý do: " + request.getHiddenReason());
    }

    @Transactional
    public void unhideRequest(User manager, Long id) {
        DesignRequest request = findRequest(id);
        if (request.getHiddenAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu này đang hiển thị.");
        }
        request.setHiddenReason(null);
        request.setHiddenAt(null);
        notificationService.notify(request.getCustomer().getId(), "REQUEST_UNHIDDEN",
                "Yêu cầu #YC-" + id + " đã hiển thị lại",
                "Yêu cầu \"" + request.getTitle() + "\" đã được hiển thị lại trên diễn đàn.",
                "design/my-requests.html");
        logService.write(manager, "REQUEST_UNHIDE", "design_requests", id,
                "Hiện lại yêu cầu #YC-" + id + " \"" + request.getTitle() + "\".");
    }

    @Transactional
    public void hideQuote(User manager, Long quoteId, String reason) {
        DesignQuote quote = findQuote(quoteId);
        DesignRequest request = quote.getRequest();
        if (quote.getHiddenAt() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Báo giá này đang bị ẩn rồi.");
        }
        if (request.getStatus() == RequestStatus.CONFIRMED && quote.getStatus() == QuoteStatus.SELECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Báo giá đã được chốt thành đơn hàng, không thể ẩn.");
        }
        if (quote.getStatus() == QuoteStatus.SELECTED) {
            quote.setStatus(QuoteStatus.PENDING);
            request.setSelectedQuoteId(null);
            notificationService.notify(request.getCustomer().getId(), "QUOTE_HIDDEN",
                    "Báo giá bạn chọn cho #YC-" + request.getId() + " đã bị ẩn",
                    "Báo giá của " + quote.getPartner().getFullName() + " vi phạm quy định nên đã bị ẩn. Vui lòng chọn báo giá khác.",
                    "design/compare-quotes.html?id=" + request.getId());
        }
        quote.setHiddenReason(reason.trim());
        quote.setHiddenAt(LocalDateTime.now());
        notificationService.notify(quote.getPartner().getId(), "QUOTE_HIDDEN",
                "Báo giá cho #YC-" + request.getId() + " đã bị ẩn",
                "Báo giá của bạn cho yêu cầu \"" + request.getTitle() + "\" đã bị ẩn. Lý do: " + quote.getHiddenReason(),
                "design/sent-quotes.html");
        logService.write(manager, "QUOTE_HIDE", "design_quotes", quoteId,
                "Ẩn báo giá #" + quoteId + " của " + quote.getPartner().getFullName() + " cho yêu cầu #YC-" + request.getId()
                        + ". Lý do: " + quote.getHiddenReason());
    }

    @Transactional
    public void unhideQuote(User manager, Long quoteId) {
        DesignQuote quote = findQuote(quoteId);
        if (quote.getHiddenAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Báo giá này đang hiển thị.");
        }
        quote.setHiddenReason(null);
        quote.setHiddenAt(null);
        notificationService.notify(quote.getPartner().getId(), "QUOTE_UNHIDDEN",
                "Báo giá cho #YC-" + quote.getRequest().getId() + " đã hiển thị lại",
                "Báo giá của bạn cho yêu cầu \"" + quote.getRequest().getTitle() + "\" đã được hiển thị lại.",
                "design/sent-quotes.html");
        logService.write(manager, "QUOTE_UNHIDE", "design_quotes", quoteId,
                "Hiện lại báo giá #" + quoteId + " của " + quote.getPartner().getFullName()
                        + " cho yêu cầu #YC-" + quote.getRequest().getId() + ".");
    }

    private DesignRequest findRequest(Long id) {
        return requests.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."));
    }

    private DesignQuote findQuote(Long id) {
        return quotes.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo giá."));
    }
}
