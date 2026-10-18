package com.flower.server.repository;

import com.flower.server.entity.DesignRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DesignRequestRepository extends JpaRepository<DesignRequest, Long> {

    List<DesignRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
