package com.farmigo.repository;

import com.farmigo.entity.AdminActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActivityLogRepository extends JpaRepository<AdminActivityLog, Long> {
    List<AdminActivityLog> findAllByOrderByTimestampDesc();
    List<AdminActivityLog> findTop20ByOrderByTimestampDesc();
}
