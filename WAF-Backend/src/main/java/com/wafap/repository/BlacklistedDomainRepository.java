package com.wafap.repository;

import com.wafap.model.BlacklistedDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlacklistedDomainRepository extends JpaRepository<BlacklistedDomain, Long> {
    Optional<BlacklistedDomain> findByDomain(String domain);
    boolean existsByDomain(String domain);
}
