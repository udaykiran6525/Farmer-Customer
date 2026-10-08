package com.farmigo.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String identifier;
    private String email;
    private String phone;
    private String password;

    // Explicit getters/setters for IDE compatibility
    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
