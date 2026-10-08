package com.farmigo.dto;

import lombok.Data;

@Data
public class OrderStatusRequest {
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
