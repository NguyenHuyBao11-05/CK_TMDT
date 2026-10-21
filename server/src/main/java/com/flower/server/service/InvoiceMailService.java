package com.flower.server.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class InvoiceMailService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String fromAddress;

    public InvoiceMailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                              @Value("${app.mail-from:}") String fromAddress) {
        this.mailSenderProvider = mailSenderProvider;
        this.fromAddress = fromAddress;
    }

    public boolean sendInvoice(String recipient, String invoiceNumber, String orderCode,
                               List<Map<String, Object>> lines, BigDecimal subtotal,
                               BigDecimal discount, BigDecimal shipping, BigDecimal total,
                               String recipientName, String recipientPhone, String address) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) return false;

        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            if (fromAddress != null && !fromAddress.isBlank()) helper.setFrom(fromAddress);
            helper.setTo(recipient);
            helper.setSubject("Hoá đơn " + invoiceNumber + " — Fw12 Floral");

            StringBuilder rows = new StringBuilder();
            for (Map<String, Object> line : lines) {
                rows.append("<tr><td style='padding:8px;border-bottom:1px solid #eee'>")
                    .append(escape(String.valueOf(line.getOrDefault("item_name", "Sản phẩm"))))
                    .append("</td><td style='padding:8px;text-align:center;border-bottom:1px solid #eee'>")
                    .append(line.get("quantity"))
                    .append("</td><td style='padding:8px;text-align:right;border-bottom:1px solid #eee'>")
                    .append(formatMoney(line.get("subtotal")))
                    .append(" đ</td></tr>");
            }

            String html = """
                <!doctype html><html lang="vi"><body style="font-family:Arial,sans-serif;color:#25352b;max-width:720px;margin:auto">
                <h2 style="color:#315c45">Fw12 Floral — Hoá đơn</h2>
                <p>Mã hoá đơn: <strong>%s</strong></p>
                <p>Mã đơn hàng: <strong>%s</strong></p>
                <h3>Thông tin nhận hàng</h3>
                <p>%s · %s<br>%s</p>
                <table style="border-collapse:collapse;width:100%%">
                <thead><tr><th style="text-align:left;padding:8px">Sản phẩm</th><th>Số lượng</th><th style="text-align:right">Thành tiền</th></tr></thead>
                <tbody>%s</tbody></table>
                <div style="margin-top:18px;line-height:1.8">
                <div>Tạm tính: %s đ</div><div>Giảm giá: %s đ</div><div>Phí giao hàng: %s đ</div>
                <strong style="font-size:18px">Tổng thanh toán: %s đ</strong></div>
                <p style="margin-top:24px;color:#68766d">Cảm ơn bạn đã mua hàng tại Fw12 Floral.</p>
                </body></html>
                """.formatted(
                    escape(invoiceNumber), escape(orderCode), escape(recipientName),
                    escape(recipientPhone), escape(address), rows,
                    formatMoney(subtotal), formatMoney(discount), formatMoney(shipping), formatMoney(total)
                );

            helper.setText(html, true);
            sender.send(message);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private static String formatMoney(Object value) {
        if (value instanceof BigDecimal amount) return amount.toPlainString();
        return value == null ? "0" : String.valueOf(value);
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
