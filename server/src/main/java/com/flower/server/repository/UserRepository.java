package com.flower.server.repository;

import com.flower.server.entity.Role;
import com.flower.server.entity.User;
import com.flower.server.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    long countByRole(Role role);

    long countByStatus(UserStatus status);

    Optional<User> findByEmailIgnoreCase(String email);
}
