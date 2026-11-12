package com.flower.server.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class VnPayService {
    private static final String PAYMENT_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private final String tmnCode;
    private final String hashSecret;
    private final String returnUrl;
    private final String frontendBaseUrl;

    public VnPayService(@Value("${app.vnpay.tmn-code:}") String tmnCode,
                        @Value("${app.vnpay.hash-secret:}") String hashSecret,
                        @Value("${app.vnpay.return-url:http://localhost:8080/api/payments/vnpay/return}") String returnUrl,
                        @Value("${app.frontend-base-url:http://localhost:63342/CK_TMDT/web}") String frontendBaseUrl) {
        this.tmnCode = tmnCode == null ? "" : tmnCode.trim();
        this.hashSecret = hashSecret == null ? "" : hashSecret.trim();
        this.returnUrl = returnUrl;
        String base = frontendBaseUrl == null ? "" : frontendBaseUrl.trim();
        this.frontendBaseUrl = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    /** URL tuyet doi toi trang ket qua tren FRONTEND (khong phai backend). */
    public String buildResultRedirect(String orderCode, String result) {
        return frontendBaseUrl + "/shop/payment-success.html?code="
                + enc(orderCode == null ? "" : orderCode) + "&payment=" + enc(result);
    }

    public String createPaymentUrl(String orderCode, BigDecimal amount, String clientIp, String orderInfo) {
        if (tmnCode.isBlank() || hashSecret.isBlank())
            throw new IllegalStateException("Chưa cấu hình VNPAY_TMN_CODE và VNPAY_HASH_SECRET.");
        Map<String,String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", amount.multiply(new BigDecimal("100")).toBigInteger().toString());
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", orderCode);
        params.put("vnp_OrderInfo", orderInfo == null ? "Thanh toan don hang " + orderCode : orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", normalizeIp(clientIp));
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        params.put("vnp_CreateDate", now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        String hashData = buildQuery(params, false);
        params.put("vnp_SecureHash", hmacSha512(hashSecret, hashData));
        return PAYMENT_URL + "?" + buildQuery(params, true);
    }

    public boolean verifySignature(Map<String,String> input) {
        if (hashSecret.isBlank() || input == null) return false;
        String received = input.get("vnp_SecureHash");
        if (received == null || received.isBlank()) return false;
        Map<String,String> params = new TreeMap<>();
        input.forEach((k,v) -> { if (k != null && v != null && !k.equals("vnp_SecureHash") && !k.equals("vnp_SecureHashType")) params.put(k,v); });
        return constantTimeEquals(received, hmacSha512(hashSecret, buildQuery(params, false)));
    }

    public boolean isPaymentSuccess(Map<String,String> p) {
        return "00".equals(p.get("vnp_ResponseCode")) && "00".equals(p.get("vnp_TransactionStatus"));
    }
    public String getOrderCode(Map<String,String> p) { return p.get("vnp_TxnRef"); }
    public String getTransactionNo(Map<String,String> p) { return p.get("vnp_TransactionNo"); }
    public String getResponseCode(Map<String,String> p) { return p.getOrDefault("vnp_ResponseCode", "99"); }

    private static String buildQuery(Map<String,String> params, boolean encode) {
        StringJoiner joiner = new StringJoiner("&");
        params.forEach((k,v) -> joiner.add(encode ? enc(k) + "=" + enc(v) : k + "=" + enc(v)));
        return joiner.toString();
    }
    private static String enc(String s) { return URLEncoder.encode(s, StandardCharsets.UTF_8); }
    private static String normalizeIp(String ip) { return ip == null || ip.isBlank() || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) ? "127.0.0.1" : ip; }
    private static String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(); for (byte b : bytes) out.append(String.format("%02x", b));
            return out.toString();
        } catch (Exception e) { throw new IllegalStateException("Không thể tạo chữ ký VNPAY.", e); }
    }
    private static boolean constantTimeEquals(String a, String b) {
        return java.security.MessageDigest.isEqual(a.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8), b.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
    }
}
