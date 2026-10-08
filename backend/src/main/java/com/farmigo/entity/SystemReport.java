package com.farmigo.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("_id")
    public Long getMongoId() {
        return this.id;
    }

    @Column(name = "report_name", nullable = false, length = 200)
    private String reportName;

    @Column(length = 200)
    private String title;

    @Column(length = 50)
    private String status;

    @Transient
    private java.util.Map<String, Object> summaryData;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType; // "MONTHLY", "REVENUE", "FARMER", "CUSTOMER", "ORDERS", "PRODUCT"

    @Column(name = "generated_by", length = 150)
    private String generatedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "generated_at", nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @Column(name = "file_format", length = 20)
    private String fileFormat; // "PDF", "EXCEL"

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) generatedAt = LocalDateTime.now();
        if (fileUrl == null) fileUrl = "";
        if (title == null && reportName != null) title = reportName;
        if (reportName == null && title != null) reportName = title;
        if (reportName == null) reportName = "System Report";
        if (title == null) title = "System Report";
        if (status == null) status = "COMPLETED";
    }

    // Explicit getters/setters for IDE compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReportName() { return reportName != null ? reportName : title; }
    public void setReportName(String reportName) { this.reportName = reportName; this.title = reportName; }
    public String getTitle() { return title != null ? title : reportName; }
    public void setTitle(String title) { this.title = title; this.reportName = title; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public java.util.Map<String, Object> getSummaryData() { return summaryData; }
    public void setSummaryData(java.util.Map<String, Object> summaryData) { this.summaryData = summaryData; }
    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }
    public String getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public String getFileFormat() { return fileFormat; }
    public void setFileFormat(String fileFormat) { this.fileFormat = fileFormat; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
}

