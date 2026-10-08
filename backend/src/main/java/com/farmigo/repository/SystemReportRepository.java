package com.farmigo.repository;

import com.farmigo.entity.SystemReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemReportRepository extends JpaRepository<SystemReport, Long> {
    List<SystemReport> findAllByOrderByGeneratedAtDesc();
}
