package com.flower.server.repository;

import com.flower.server.entity.DesignQuote;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DesignQuoteRepository extends JpaRepository<DesignQuote, Long> {

    @EntityGraph(attributePaths = "partner")
    List<DesignQuote> findByRequestIdInOrderByPriceAsc(Collection<Long> requestIds);

    @EntityGraph(attributePaths = "partner")
    List<DesignQuote> findByRequestId(Long requestId);

    @EntityGraph(attributePaths = {"request", "request.customer"})
    List<DesignQuote> findByPartnerIdOrderByCreatedAtDesc(Long partnerId);

    boolean existsByRequestIdAndPartnerId(Long requestId, Long partnerId);
}
