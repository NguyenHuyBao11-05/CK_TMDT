package com.flower.server.service;

import com.flower.server.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final Logger LOG = LoggerFactory.getLogger(RecommendationService.class);
    public static final int TOP_K = 4;
    private static final int KEEP_PER_PRODUCT = 8;
    private static final double CF_WEIGHT = 0.75;
    private static final double SHRINK = 3.0;

    private static final String PURCHASE_SQL = """
            SELECT o.customer_id, oi.product_id, COUNT(DISTINCT o.id) AS times,
                   MAX(o.created_at) AS last_at, AVG(r.rating) AS rating
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id AND p.status = 'APPROVED'
            LEFT JOIN reviews r ON r.order_id = o.id AND r.product_id = oi.product_id
            WHERE o.status <> 'CANCELLED' AND (o.payment_status = 'PAID' OR o.status = 'RECEIVED')
            """;

    private static final String PRODUCT_SQL = """
            SELECT p.id, p.name, p.material, p.price, p.discount_price, p.thumbnail_url,
                   u.full_name AS partner_name, COALESCE(bs.total_sold, 0) AS total_sold,
                   COALESCE(rv.rating, 0) AS rating
            FROM products p
            JOIN users u ON u.id = p.partner_id
            LEFT JOIN v_best_seller_products bs ON bs.id = p.id
            LEFT JOIN (SELECT product_id, AVG(rating) AS rating FROM reviews
                       WHERE product_id IS NOT NULL GROUP BY product_id) rv ON rv.product_id = p.id
            WHERE p.status = 'APPROVED' AND p.id IN (%s)
            """;

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final LogService logs;

    public RecommendationService(JdbcTemplate jdbc, TransactionTemplate tx, LogService logs) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.logs = logs;
    }

    record Product(long id, String material, double price) {}

    record Purchase(long customerId, long productId, double weight, Timestamp lastAt) {}

    record Pair(long productId, long similarId, double score, double cf, double content) {}

    record Evaluation(int testUsers, Double hitRate, Double precision, Double baselineHitRate) {}

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "${app.recommendation-train-cron:0 0 2 * * *}")
    public void trainAutomatically() {
        try {
            train(null);
        } catch (DataAccessException e) {
            LOG.warn("Chưa huấn luyện được mô hình gợi ý, kiểm tra bảng product_similarity và recommendation_runs: {}", e.getMessage());
        }
    }

    public synchronized Map<String, Object> train(User actor) {
        long start = System.currentTimeMillis();
        Map<Long, Product> products = loadProducts();
        List<Purchase> purchases = jdbc.query(PURCHASE_SQL + " GROUP BY o.customer_id, oi.product_id",
                (rs, row) -> new Purchase(rs.getLong("customer_id"), rs.getLong("product_id"),
                        weight(rs.getInt("times"), (Number) rs.getObject("rating")), rs.getTimestamp("last_at")));

        Map<Long, List<Pair>> similarity = similarity(products, purchases);
        Evaluation evaluation = evaluate(products, purchases);
        List<Pair> model = similarity.values().stream()
                .flatMap(list -> list.stream().limit(KEEP_PER_PRODUCT))
                .toList();
        long customers = purchases.stream().map(Purchase::customerId).distinct().count();

        Long runId = tx.execute(status -> {
            jdbc.update("DELETE FROM product_similarity");
            jdbc.batchUpdate("""
                            INSERT INTO product_similarity (product_id, similar_product_id, score, cf_score, content_score)
                            VALUES (?, ?, ?, ?, ?)
                            """, model, 500,
                    (ps, pair) -> {
                        ps.setLong(1, pair.productId());
                        ps.setLong(2, pair.similarId());
                        ps.setDouble(3, pair.score());
                        ps.setDouble(4, pair.cf());
                        ps.setDouble(5, pair.content());
                    });
            KeyHolder key = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement("""
                        INSERT INTO recommendation_runs (trigger_type, triggered_by, customers, products, interactions,
                                                         pairs, top_k, test_users, hit_rate, precision_at_k,
                                                         baseline_hit_rate, duration_ms)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, actor == null ? "AUTO" : "MANUAL");
                ps.setObject(2, actor == null ? null : actor.getId());
                ps.setLong(3, customers);
                ps.setInt(4, products.size());
                ps.setInt(5, purchases.size());
                ps.setInt(6, model.size());
                ps.setInt(7, TOP_K);
                ps.setInt(8, evaluation.testUsers());
                ps.setObject(9, evaluation.hitRate());
                ps.setObject(10, evaluation.precision());
                ps.setObject(11, evaluation.baselineHitRate());
                ps.setLong(12, System.currentTimeMillis() - start);
                return ps;
            }, key);
            return key.getKey().longValue();
        });

        if (actor != null) {
            logs.write(actor, "RECOMMEND_TRAIN", "recommendation_runs", runId,
                    "Huấn luyện lại mô hình gợi ý: " + purchases.size() + " lượt mua của " + customers
                            + " khách, Hit rate@" + TOP_K + " = " + percent(evaluation.hitRate()) + ".");
        }
        return dashboard();
    }

    public List<Map<String, Object>> similar(long productId) {
        try {
            return productsInOrder(jdbc.queryForList("""
                    SELECT similar_product_id FROM product_similarity
                    WHERE product_id = ? ORDER BY score DESC LIMIT ?
                    """, Long.class, productId, TOP_K));
        } catch (DataAccessException e) {
            return List.of();
        }
    }

    public List<Map<String, Object>> forCustomer(long customerId) {
        try {
            return productsInOrder(customerRanking(customerId));
        } catch (DataAccessException e) {
            return List.of();
        }
    }

    private List<Long> customerRanking(long customerId) {
        Map<Long, Double> history = new HashMap<>();
        jdbc.query(PURCHASE_SQL + " AND o.customer_id = ? GROUP BY o.customer_id, oi.product_id",
                rs -> {
                    history.put(rs.getLong("product_id"), weight(rs.getInt("times"), (Number) rs.getObject("rating")));
                }, customerId);
        if (history.isEmpty()) {
            return List.of();
        }

        Map<Long, List<Pair>> neighbours = new HashMap<>();
        String in = String.join(",", Collections.nCopies(history.size(), "?"));
        jdbc.query("SELECT product_id, similar_product_id, score FROM product_similarity WHERE product_id IN (" + in + ")",
                rs -> {
                    neighbours.computeIfAbsent(rs.getLong("product_id"), k -> new ArrayList<>())
                            .add(new Pair(rs.getLong("product_id"), rs.getLong("similar_product_id"), rs.getDouble("score"), 0, 0));
                }, history.keySet().toArray());
        return rank(history, neighbours, 8);
    }

    public Map<String, Object> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> runs = jdbc.queryForList("""
                SELECT r.id, r.trigger_type, u.full_name AS triggered_by_name, r.customers, r.products,
                       r.interactions, r.pairs, r.top_k, r.test_users, r.hit_rate, r.precision_at_k,
                       r.baseline_hit_rate, r.duration_ms, r.trained_at
                FROM recommendation_runs r
                LEFT JOIN users u ON u.id = r.triggered_by
                ORDER BY r.id DESC LIMIT 10
                """);
        result.put("latest", runs.isEmpty() ? null : runs.get(0));
        result.put("runs", runs);
        result.put("top_pairs", jdbc.queryForList("""
                SELECT a.name AS product_name, b.name AS similar_name, s.score, s.cf_score, s.content_score
                FROM product_similarity s
                JOIN products a ON a.id = s.product_id
                JOIN products b ON b.id = s.similar_product_id
                WHERE s.product_id < s.similar_product_id
                ORDER BY s.cf_score DESC, s.score DESC LIMIT 10
                """));
        return result;
    }

    private Map<Long, Product> loadProducts() {
        Map<Long, Product> products = new LinkedHashMap<>();
        jdbc.query("SELECT id, material, COALESCE(discount_price, price) AS price FROM products WHERE status = 'APPROVED'",
                rs -> {
                    products.put(rs.getLong("id"), new Product(rs.getLong("id"), rs.getString("material"), rs.getDouble("price")));
                });
        return products;
    }

    private static double weight(int times, Number rating) {
        double value = Math.min(times, 3);
        if (rating != null) {
            value += (rating.doubleValue() - 3) * 0.5;
        }
        return Math.max(0.1, value);
    }

    private static Map<Long, List<Pair>> similarity(Map<Long, Product> products, List<Purchase> purchases) {
        Map<Long, Map<Long, Double>> vectors = new HashMap<>();
        for (Purchase p : purchases) {
            vectors.computeIfAbsent(p.productId(), k -> new HashMap<>()).put(p.customerId(), p.weight());
        }
        Map<Long, Double> norms = new HashMap<>();
        vectors.forEach((id, v) -> norms.put(id, Math.sqrt(v.values().stream().mapToDouble(w -> w * w).sum())));

        Map<Long, List<Pair>> result = new HashMap<>();
        List<Product> list = new ArrayList<>(products.values());
        for (int i = 0; i < list.size(); i++) {
            for (int j = i + 1; j < list.size(); j++) {
                Product a = list.get(i);
                Product b = list.get(j);
                double cf = collaborative(vectors.get(a.id()), vectors.get(b.id()), norms.get(a.id()), norms.get(b.id()));
                double content = content(a, b);
                double score = CF_WEIGHT * cf + (1 - CF_WEIGHT) * content;
                result.computeIfAbsent(a.id(), k -> new ArrayList<>()).add(new Pair(a.id(), b.id(), score, cf, content));
                result.computeIfAbsent(b.id(), k -> new ArrayList<>()).add(new Pair(b.id(), a.id(), score, cf, content));
            }
        }
        result.values().forEach(pairs -> pairs.sort(Comparator.comparingDouble(Pair::score).reversed()));
        return result;
    }

    private static double collaborative(Map<Long, Double> a, Map<Long, Double> b, Double normA, Double normB) {
        if (a == null || b == null || normA == 0 || normB == 0) {
            return 0;
        }
        Map<Long, Double> small = a.size() <= b.size() ? a : b;
        Map<Long, Double> large = small == a ? b : a;
        double dot = 0;
        int common = 0;
        for (Map.Entry<Long, Double> e : small.entrySet()) {
            Double other = large.get(e.getKey());
            if (other != null) {
                dot += e.getValue() * other;
                common++;
            }
        }
        return dot / (normA * normB) * common / (common + SHRINK);
    }

    private static double content(Product a, Product b) {
        double sameMaterial = a.material().equalsIgnoreCase(b.material()) ? 0.6 : 0;
        double maxPrice = Math.max(a.price(), b.price());
        double priceClose = maxPrice == 0 ? 1 : 1 - Math.abs(a.price() - b.price()) / maxPrice;
        return sameMaterial + 0.4 * priceClose;
    }

    private static List<Long> rank(Map<Long, Double> history, Map<Long, List<Pair>> neighbours, int limit) {
        Map<Long, Double> scores = new HashMap<>();
        history.forEach((productId, w) -> {
            for (Pair pair : neighbours.getOrDefault(productId, List.of())) {
                if (!history.containsKey(pair.similarId())) {
                    scores.merge(pair.similarId(), w * pair.score(), Double::sum);
                }
            }
        });
        return scores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .limit(limit)
                .map(Map.Entry::getKey)
                .toList();
    }

    private static Evaluation evaluate(Map<Long, Product> products, List<Purchase> purchases) {
        Map<Long, List<Purchase>> byCustomer = purchases.stream().collect(Collectors.groupingBy(Purchase::customerId));
        Map<Long, Purchase> holdout = new HashMap<>();
        byCustomer.forEach((customerId, list) -> {
            if (list.size() >= 2) {
                holdout.put(customerId, list.stream()
                        .max(Comparator.comparing(Purchase::lastAt).thenComparing(Purchase::productId))
                        .orElseThrow());
            }
        });
        if (holdout.isEmpty()) {
            return new Evaluation(0, null, null, null);
        }

        List<Purchase> train = purchases.stream().filter(p -> !p.equals(holdout.get(p.customerId()))).toList();
        Map<Long, List<Pair>> similarity = similarity(products, train);
        Map<Long, Long> popularity = train.stream().collect(Collectors.groupingBy(Purchase::productId, Collectors.counting()));

        int hits = 0;
        int baselineHits = 0;
        for (Map.Entry<Long, Purchase> test : holdout.entrySet()) {
            Map<Long, Double> history = train.stream()
                    .filter(p -> p.customerId() == test.getKey())
                    .collect(Collectors.toMap(Purchase::productId, Purchase::weight));
            long target = test.getValue().productId();
            if (rank(history, similarity, TOP_K).contains(target)) {
                hits++;
            }
            List<Long> popular = products.keySet().stream()
                    .filter(id -> !history.containsKey(id))
                    .sorted(Comparator.<Long>comparingLong(id -> popularity.getOrDefault(id, 0L)).reversed().thenComparing(id -> id))
                    .limit(TOP_K)
                    .toList();
            if (popular.contains(target)) {
                baselineHits++;
            }
        }
        int n = holdout.size();
        return new Evaluation(n, (double) hits / n, (double) hits / (n * TOP_K), (double) baselineHits / n);
    }

    private List<Map<String, Object>> productsInOrder(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        String in = String.join(",", Collections.nCopies(ids.size(), "?"));
        Map<Long, Map<String, Object>> rows = new HashMap<>();
        for (Map<String, Object> row : jdbc.queryForList(PRODUCT_SQL.formatted(in), ids.toArray())) {
            rows.put(((Number) row.get("id")).longValue(), row);
        }
        return ids.stream().map(rows::get).filter(Objects::nonNull).toList();
    }

    private static String percent(Double value) {
        return value == null ? "chưa đủ dữ liệu" : Math.round(value * 1000) / 10.0 + "%";
    }
}
