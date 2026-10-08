package com.farmigo.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferences {

    @Builder.Default
    private Boolean newOrders = true;

    @Builder.Default
    private Boolean orderStatusUpdates = true;

    @Builder.Default
    private Boolean aiDemandPredictorAlerts = true;

    @Builder.Default
    private Boolean governmentSchemeUpdates = true;

    @Builder.Default
    private Boolean smartStockRescueAlerts = true;

    @Builder.Default
    private Boolean promotionalNotifications = false;

    @Builder.Default
    private Boolean weatherAlerts = true;

    @Builder.Default
    private Boolean lowStockAlerts = true;

    @Builder.Default
    private Boolean emailNotifications = true;

    @Builder.Default
    private Boolean smsNotifications = true;
}
