package com.farmigo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "government_schemes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GovernmentScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("_id")
    public Long getMongoId() {
        return this.id;
    }

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private String state;
    private String category;
    private String benefit;
    private String link;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
