package com.flower.server.repository;

import com.flower.server.entity.DesignRequest;
import com.flower.server.entity.RequestStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DesignRequestRepository extends JpaRepository<DesignRequest, Long> {

    List<DesignRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = "customer")
    List<DesignRequest> findByStatusAndHiddenAtIsNullAndDesiredDateAfterOrderByCreatedAtDesc(RequestStatus status, LocalDateTime now);

    @EntityGraph(attributePaths = "customer")
    List<DesignRequest> findByStatusAndDesiredDateBefore(RequestStatus status, LocalDateTime now);
}
