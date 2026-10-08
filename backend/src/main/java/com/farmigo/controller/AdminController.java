package com.farmigo.controller;

import com.farmigo.dto.LoginRequest;
import com.farmigo.entity.Order;
import com.farmigo.entity.SupportTicket;
import com.farmigo.security.UserPrincipal;
import com.farmigo.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/auth/init")
    public ResponseEntity<Map<String, Object>> initAdmin() {
        adminService.initDefaultAdmin();
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Default super admin account checked/initialized successfully");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(adminService.login(req.getEmail(), req.getPassword()));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(adminService.getAnalytics());
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers(@RequestParam(defaultValue = "farmer") String role,
                                                              @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getUsers(role, search));
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<Map<String, Object>> blockUser(@PathVariable Long id,
                                                         @RequestBody(required = false) Map<String, String> payload,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        String reason = payload != null ? payload.get("reason") : "Administrative action";
        String adminEmail = principal != null ? principal.getEmail() : "admin@farmigo.com";
        return ResponseEntity.ok(adminService.blockUser(id, reason, adminEmail));
    }

    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<Map<String, Object>> unblockUser(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserPrincipal principal) {
        String adminEmail = principal != null ? principal.getEmail() : "admin@farmigo.com";
        return ResponseEntity.ok(adminService.unblockUser(id, adminEmail));
    }

    @GetMapping("/products")
    public ResponseEntity<List<Map<String, Object>>> getProducts(@RequestParam(required = false) String search,
                                                                 @RequestParam(defaultValue = "all") String status) {
        return ResponseEntity.ok(adminService.getProductsWithApproval(search, status));
    }

    @PostMapping("/products/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveProduct(@PathVariable Long id,
                                                              @RequestBody(required = false) Map<String, String> payload,
                                                              @AuthenticationPrincipal UserPrincipal principal) {
        String comments = payload != null ? payload.get("comments") : "Approved by admin";
        String adminEmail = principal != null ? principal.getEmail() : "admin@farmigo.com";
        return ResponseEntity.ok(adminService.approveProduct(id, adminEmail, comments));
    }

    @PostMapping("/products/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectProduct(@PathVariable Long id,
                                                             @RequestBody(required = false) Map<String, String> payload,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        String comments = payload != null ? payload.get("comments") : "Rejected by admin";
        String adminEmail = principal != null ? principal.getEmail() : "admin@farmigo.com";
        return ResponseEntity.ok(adminService.rejectProduct(id, adminEmail, comments));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders(@RequestParam(defaultValue = "all") String status,
                                                 @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getOrders(status, search));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id,
                                                   @RequestBody Map<String, String> payload,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        String status = payload.get("status");
        String adminEmail = principal != null ? principal.getEmail() : "admin@farmigo.com";
        return ResponseEntity.ok(adminService.updateOrderStatus(id, status, adminEmail));
    }

    @GetMapping("/support")
    public ResponseEntity<List<SupportTicket>> getSupportTickets() {
        return ResponseEntity.ok(adminService.getSupportTickets());
    }

    @PutMapping("/support/{id}/resolve")
    public ResponseEntity<SupportTicket> resolveTicket(@PathVariable Long id,
                                                       @RequestBody(required = false) Map<String, String> payload,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        String status = payload != null ? payload.get("status") : "RESOLVED";
        String response = payload != null ? payload.get("response") : "Issue resolved by admin";
        String adminEmail = principal != null ? principal.getEmail() : "admin@farmigo.com";
        return ResponseEntity.ok(adminService.resolveTicket(id, status, adminEmail, response));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<com.farmigo.entity.AdminActivityLog>> getActivityLogs() {
        return ResponseEntity.ok(adminService.getActivityLogs());
    }

    @GetMapping("/reports")
    public ResponseEntity<List<com.farmigo.entity.SystemReport>> getReports() {
        return ResponseEntity.ok(adminService.getReports());
    }

    @PostMapping("/reports/generate")
    public ResponseEntity<com.farmigo.entity.SystemReport> generateReport(@RequestBody Map<String, String> payload,
                                                                          @AuthenticationPrincipal UserPrincipal principal) {
        String title = payload.get("title");
        String type = payload.get("type");
        String adminEmail = principal != null ? principal.getEmail() : "admin@farmigo.com";
        return ResponseEntity.ok(adminService.generateReport(title, type, adminEmail));
    }
}
