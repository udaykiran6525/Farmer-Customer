package com.farmigo.repository;

import com.farmigo.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    Optional<BlockedUser> findByUserId(Long userId);
    Optional<BlockedUser> findByEmailIgnoreCase(String email);
    boolean existsByUserId(Long userId);
    boolean existsByEmailIgnoreCase(String email);
    void deleteByUserId(Long userId);
}
