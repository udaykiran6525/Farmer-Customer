package com.farmigo.repository;

import com.farmigo.entity.ProductApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductApprovalRepository extends JpaRepository<ProductApproval, Long> {
    Optional<ProductApproval> findByProductId(Long productId);
    void deleteByProductId(Long productId);
    long countByStatusIgnoreCase(String status);
}
