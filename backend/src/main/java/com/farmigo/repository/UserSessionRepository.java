package com.farmigo.repository;

import com.farmigo.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserIdAndIsActiveTrueOrderByLastActiveTimeDesc(Long userId);
    List<UserSession> findByUserId(Long userId);
}
