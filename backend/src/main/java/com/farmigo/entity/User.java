package com.farmigo.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("_id")
    public Long getMongoId() {
        return this.id;
    }

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 30)
    private String role; // "farmer" or "customer"

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    private String state;
    private String district;
    private String village;
    private String address;
    private String city;
    private String pincode;

    @Column(name = "farm_name")
    private String farmName;

    @Column(name = "farm_size")
    private String farmSize;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_crops", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "crop")
    @Builder.Default
    private List<String> crops = new ArrayList<>();

    @Column(length = 10)
    private String language; // "en", "te", "hi"

    @Column(name = "bank_account_details", length = 500)
    private String bankAccountDetails;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @Column(name = "two_factor_enabled")
    @Builder.Default
    private Boolean twoFactorEnabled = false;

    @Column(name = "time_zone", length = 100)
    @Builder.Default
    private String timeZone = "Asia/Kolkata";

    @Embedded
    private NotificationPreferences notificationPreferences;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (profileImage == null) profileImage = "";
        if (state == null) state = "";
        if (district == null) district = "";
        if (village == null) village = "";
        if (address == null) address = "";
        if (city == null) city = "";
        if (pincode == null) pincode = "";
        if (farmName == null) farmName = "";
        if (farmSize == null) farmSize = "";
        if (language == null) language = "en";
        if (crops == null) crops = new ArrayList<>();
        if (bankAccountDetails == null) bankAccountDetails = "";
        if (upiId == null) upiId = "";
        if (twoFactorEnabled == null) twoFactorEnabled = false;
        if (timeZone == null) timeZone = "Asia/Kolkata";
        if (notificationPreferences == null) notificationPreferences = new NotificationPreferences();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (notificationPreferences == null) notificationPreferences = new NotificationPreferences();
    }

    // Explicit getters/setters for IDE compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getFarmName() { return farmName; }
    public void setFarmName(String farmName) { this.farmName = farmName; }
    public String getFarmSize() { return farmSize; }
    public void setFarmSize(String farmSize) { this.farmSize = farmSize; }
    public List<String> getCrops() { return crops; }
    public void setCrops(List<String> crops) { this.crops = crops; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getBankAccountDetails() { return bankAccountDetails; }
    public void setBankAccountDetails(String bankAccountDetails) { this.bankAccountDetails = bankAccountDetails; }
    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }
    public Boolean getTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(Boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }
    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }
    public NotificationPreferences getNotificationPreferences() {
        if (notificationPreferences == null) notificationPreferences = new NotificationPreferences();
        return notificationPreferences;
    }
    public void setNotificationPreferences(NotificationPreferences notificationPreferences) { this.notificationPreferences = notificationPreferences; }
}


