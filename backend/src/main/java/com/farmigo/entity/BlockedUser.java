package com.farmigo.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("_id")
    public Long getMongoId() {
        return this.id;
    }

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 50)
    private String role; // "farmer" or "customer"

    @Column(length = 500)
    private String reason;

    @Column(name = "blocked_by", length = 150)
    private String blockedBy;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "blocked_at", nullable = false, updatable = false)
    private LocalDateTime blockedAt;

    @PrePersist
    protected void onCreate() {
        if (blockedAt == null) blockedAt = LocalDateTime.now();
        if (reason == null) reason = "Blocked by Super Admin";
        if (blockedBy == null) blockedBy = "Super Admin";
        if (isActive == null) isActive = true;
    }

    // Explicit getters/setters for IDE compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getBlockedBy() { return blockedBy; }
    public void setBlockedBy(String blockedBy) { this.blockedBy = blockedBy; }
    public Boolean getIsActive() { return isActive != null ? isActive : true; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getBlockedAt() { return blockedAt; }
    public void setBlockedAt(LocalDateTime blockedAt) { this.blockedAt = blockedAt; }
}

