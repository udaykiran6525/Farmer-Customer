package com.farmigo.service;

import com.farmigo.entity.*;
import com.farmigo.repository.*;
import com.farmigo.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final AdminUserRepository adminUserRepository;
    private final AdminActivityLogRepository adminActivityLogRepository;
    private final ProductApprovalRepository productApprovalRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final SystemReportRepository systemReportRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    public AdminService(AdminUserRepository adminUserRepository,
                        AdminActivityLogRepository adminActivityLogRepository,
                        ProductApprovalRepository productApprovalRepository,
                        BlockedUserRepository blockedUserRepository,
                        SystemReportRepository systemReportRepository,
                        UserRepository userRepository,
                        ProductRepository productRepository,
                        OrderRepository orderRepository,
                        SupportTicketRepository supportTicketRepository,
                        PasswordEncoder passwordEncoder,
                        JwtTokenProvider jwtTokenProvider) {
        this.adminUserRepository = adminUserRepository;
        this.adminActivityLogRepository = adminActivityLogRepository;
        this.productApprovalRepository = productApprovalRepository;
        this.blockedUserRepository = blockedUserRepository;
        this.systemReportRepository = systemReportRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public void initDefaultAdmin() {
        if (!adminUserRepository.existsByEmailIgnoreCase("admin@farmigo.com")) {
            AdminUser admin = new AdminUser();
            admin.setEmail("admin@farmigo.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setName("Super Admin");
            admin.setRole("SUPER_ADMIN");
            admin.setPhone("9999999999");
            admin.setIsActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            adminUserRepository.save(admin);

            logActivity("system@farmigo.com", "INIT_ADMIN", "AdminUser", admin.getEmail(), "Initialized default super admin account");
        }
        initDefaultSupportTickets();
    }

    @Transactional
    public void initDefaultSupportTickets() {
        if (supportTicketRepository.count() == 0) {
            List<SupportTicket> tickets = Arrays.asList(
                SupportTicket.builder()
                    .userName("Ramesh Kumar")
                    .userEmail("ramesh.farmer@gmail.com")
                    .subject("Payment Settlement Delay for Order #FARM-1082")
                    .message("Namaste Admin team. I shipped 250kg Sona Masoori Rice on July 28th. Order was delivered successfully but payment settlement is still showing processing. Please check and release payout to my bank account.")
                    .ticketType("PAYMENT")
                    .status("PENDING")
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .build(),
                SupportTicket.builder()
                    .userName("Priya Sharma")
                    .userEmail("priya.sharma92@gmail.com")
                    .subject("Item Received Damaged - Organic Chilli Powder")
                    .message("Hello, I received package #FARM-1094 yesterday. The outer sealing of Red Chilli Powder packet was torn during transit. Need replacement or refund.")
                    .ticketType("QUALITY")
                    .status("IN_PROGRESS")
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build(),
                SupportTicket.builder()
                    .userName("Venkat Rao")
                    .userEmail("venkat.guntur@gmail.com")
                    .subject("Unable to Upload High-Res Organic Certificate Image")
                    .message("Hi, when I try to upload my Organic Farming Accreditation Certificate PNG in farmer settings, it throws an error 'File size exceeds'. Can you assist?")
                    .ticketType("TECHNICAL")
                    .status("RESOLVED")
                    .createdAt(LocalDateTime.now().minusDays(4))
                    .build(),
                SupportTicket.builder()
                    .userName("Suresh Patel")
                    .userEmail("suresh.p@gmail.com")
                    .subject("Delivery Partner Tracking Link Not Updating")
                    .message("Order #FARM-1102 has been marked dispatched by farmer Uday Kiran, but the courier tracking URL is not loading location coordinates. Kindly update status.")
                    .ticketType("LOGISTICS")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(3))
                    .build(),
                SupportTicket.builder()
                    .userName("Lakshmi Narayana")
                    .userEmail("lakshmi.krishi@gmail.com")
                    .subject("Request to Update Bank Account Details (IFSC Code Change)")
                    .message("Recently my bank merged with SBI. Need to update my IFSC code and branch details in profile.")
                    .ticketType("ACCOUNT")
                    .status("RESOLVED")
                    .createdAt(LocalDateTime.now().minusDays(6))
                    .build(),
                SupportTicket.builder()
                    .userName("Anita Reddy")
                    .userEmail("anita.reddy@gmail.com")
                    .subject("Bulk Order Discount Inquiry for Community Buying")
                    .message("We want to purchase 500kg Alphonso Mangoes & Cashews for our housing society. Is bulk pricing available?")
                    .ticketType("INQUIRY")
                    .status("RESOLVED")
                    .createdAt(LocalDateTime.now().minusDays(7))
                    .build()
            );
            supportTicketRepository.saveAll(tickets);
            logActivity("system@farmigo.com", "INIT_TICKETS", "SupportTicket", "6", "Initialized default customer support tickets");
        }
    }

    @Transactional
    public Map<String, Object> login(String email, String password) {
        initDefaultAdmin();
        AdminUser admin = adminUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Invalid admin credentials"));

        if (!passwordEncoder.matches(password, admin.getPassword())) {
            logActivity(email, "LOGIN_FAILED", "AdminUser", email, "Failed login attempt: incorrect password");
            throw new RuntimeException("Invalid admin credentials");
        }

        if (admin.getIsActive() != null && !admin.getIsActive()) {
            logActivity(email, "LOGIN_FAILED", "AdminUser", email, "Failed login attempt: account disabled");
            throw new RuntimeException("Admin account is disabled");
        }

        admin.setLastLogin(LocalDateTime.now());
        adminUserRepository.save(admin);

        logActivity(admin.getEmail(), "LOGIN", "AdminUser", String.valueOf(admin.getId()), "Admin logged in successfully");

        String token = jwtTokenProvider.generateAdminTokenFromUserId(admin.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("admin", admin);
        return response;
    }

    @Transactional
    public void logActivity(String adminEmail, String action, String targetType, String targetId, String details) {
        AdminActivityLog log = new AdminActivityLog();
        log.setAdminEmail(adminEmail);
        log.setAction(action);
        log.setTargetType(targetType);
        Long tid = 0L;
        if (targetId != null) {
            try {
                tid = Long.parseLong(targetId);
            } catch (NumberFormatException e) {
                tid = 0L;
            }
        }
        log.setTargetId(tid);
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());
        adminActivityLogRepository.save(log);
    }


    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        long totalFarmers = userRepository.countByRoleIgnoreCase("farmer");
        long totalCustomers = userRepository.countByRoleIgnoreCase("customer");
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();

        List<Order> orders = orderRepository.findAll();
        double totalRevenue = orders.stream()
                .filter(o -> o.getStatus() != null && !o.getStatus().equalsIgnoreCase("cancelled"))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum();

        long pendingApprovals = productApprovalRepository.countByStatusIgnoreCase("PENDING");
        long activeTickets = supportTicketRepository.countByStatusIgnoreCase("OPEN");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFarmers", totalFarmers);
        stats.put("totalCustomers", totalCustomers);
        stats.put("totalProducts", totalProducts);
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("activeTickets", activeTickets);
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalytics() {
        List<Order> orders = orderRepository.findAll();
        List<User> users = userRepository.findAll();
        List<Product> products = productRepository.findAll();

        // Monthly sales trend (Last 6 months)
        Map<String, Double> monthlyRevenue = new LinkedHashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime targetMonth = now.minusMonths(i);
            String monthLabel = targetMonth.format(monthFormatter);
            double revenue = orders.stream()
                    .filter(o -> o.getCreatedAt() != null &&
                            o.getCreatedAt().getYear() == targetMonth.getYear() &&
                            o.getCreatedAt().getMonthValue() == targetMonth.getMonthValue() &&
                            !o.getStatus().equalsIgnoreCase("cancelled"))
                    .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                    .sum();
            monthlyRevenue.put(monthLabel, revenue);
        }

        // Top categories
        Map<String, Long> categoryCounts = products.stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(p -> p.getCategory().toUpperCase(), Collectors.counting()));

        // Order status distribution
        Map<String, Long> orderStatusCounts = orders.stream()
                .filter(o -> o.getStatus() != null)
                .collect(Collectors.groupingBy(o -> o.getStatus().toUpperCase(), Collectors.counting()));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("monthlyRevenue", monthlyRevenue);
        analytics.put("categoryDistribution", categoryCounts);
        analytics.put("orderStatusDistribution", orderStatusCounts);
        analytics.put("totalUsersCount", users.size());
        return analytics;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUsers(String role, String search) {
        List<User> users = (role == null || role.trim().isEmpty() || role.equalsIgnoreCase("all"))
                ? userRepository.findAll()
                : userRepository.findByRoleIgnoreCase(role);

        return users.stream()
                .filter(u -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String q = search.toLowerCase();
                    boolean nameMatch = u.getName() != null && u.getName().toLowerCase().contains(q);
                    boolean emailMatch = u.getEmail() != null && u.getEmail().toLowerCase().contains(q);
                    boolean phoneMatch = u.getPhone() != null && u.getPhone().toLowerCase().contains(q);
                    return nameMatch || emailMatch || phoneMatch;
                })
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("email", u.getEmail());
                    map.put("phone", u.getPhone());
                    map.put("role", u.getRole());
                    map.put("address", u.getAddress());
                    map.put("city", u.getCity());
                    map.put("state", u.getState());
                    map.put("createdAt", u.getCreatedAt());

                    Optional<BlockedUser> blockedOpt = blockedUserRepository.findByUserId(u.getId());
                    boolean isBlocked = blockedOpt.isPresent() && Boolean.TRUE.equals(blockedOpt.get().getIsActive());
                    map.put("isBlocked", isBlocked);
                    if (isBlocked) {
                        map.put("blockReason", blockedOpt.get().getReason());
                        map.put("blockedAt", blockedOpt.get().getBlockedAt());
                    }
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> blockUser(Long userId, String reason, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        BlockedUser blockedUser = blockedUserRepository.findByUserId(userId).orElse(new BlockedUser());
        blockedUser.setUserId(user.getId());
        blockedUser.setEmail(user.getEmail());
        blockedUser.setRole(user.getRole());
        blockedUser.setReason(reason != null && !reason.isEmpty() ? reason : "Administrative action");
        blockedUser.setBlockedBy(adminEmail);
        blockedUser.setBlockedAt(LocalDateTime.now());
        blockedUser.setIsActive(true);
        blockedUserRepository.save(blockedUser);

        logActivity(adminEmail, "BLOCK_USER", "User", String.valueOf(userId), "Blocked user " + user.getEmail() + ". Reason: " + blockedUser.getReason());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "User blocked successfully");
        return res;
    }

    @Transactional
    public Map<String, Object> unblockUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Optional<BlockedUser> blockedOpt = blockedUserRepository.findByUserId(userId);
        if (blockedOpt.isPresent()) {
            BlockedUser blockedUser = blockedOpt.get();
            blockedUser.setIsActive(false);
            blockedUserRepository.save(blockedUser);
        }

        logActivity(adminEmail, "UNBLOCK_USER", "User", String.valueOf(userId), "Unblocked user " + user.getEmail());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "User unblocked successfully");
        return res;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProductsWithApproval(String search, String status) {
        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId());
                    map.put("name", p.getName());
                    map.put("category", p.getCategory());
                    map.put("price", p.getPrice());
                    map.put("unit", p.getUnit());
                    map.put("quantity", p.getQuantity());
                    map.put("description", p.getDescription());
                    map.put("image", p.getImageUrl());
                    map.put("imageUrl", p.getImageUrl());
                    map.put("isAvailable", p.getIsAvailable());
                    map.put("createdAt", p.getCreatedAt());

                    if (p.getFarmer() != null) {
                        Map<String, Object> farmerMap = new HashMap<>();
                        farmerMap.put("id", p.getFarmer().getId());
                        farmerMap.put("name", p.getFarmer().getName());
                        farmerMap.put("email", p.getFarmer().getEmail());
                        farmerMap.put("phone", p.getFarmer().getPhone());
                        map.put("farmer", farmerMap);
                    }

                    Optional<ProductApproval> approvalOpt = productApprovalRepository.findByProductId(p.getId());
                    if (approvalOpt.isPresent()) {
                        ProductApproval approval = approvalOpt.get();
                        map.put("approvalStatus", approval.getStatus());
                        map.put("approvalComments", approval.getComments());
                        map.put("reviewedBy", approval.getReviewedBy());
                        map.put("reviewedAt", approval.getReviewedAt());
                    } else {
                        String st = p.getStatus() != null ? p.getStatus().toUpperCase() : "PENDING";
                        map.put("approvalStatus", st);
                        map.put("approvalComments", "PENDING".equals(st) ? "Awaiting admin review" : "Auto-approved product");
                        map.put("reviewedBy", "SYSTEM");
                    }
                    return map;
                })
                .filter(map -> {
                    if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("all")) {
                        String appStatus = (String) map.get("approvalStatus");
                        if (!status.equalsIgnoreCase(appStatus)) return false;
                    }
                    if (search != null && !search.trim().isEmpty()) {
                        String q = search.toLowerCase();
                        String name = (String) map.get("name");
                        String cat = (String) map.get("category");
                        return (name != null && name.toLowerCase().contains(q)) ||
                               (cat != null && cat.toLowerCase().contains(q));
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> approveProduct(Long productId, String adminEmail, String comments) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        product.setStatus("APPROVED");
        product.setIsAvailable(true);
        productRepository.save(product);

        ProductApproval approval = productApprovalRepository.findByProductId(productId).orElse(new ProductApproval());
        approval.setProductId(productId);
        approval.setStatus("APPROVED");
        approval.setReviewedBy(adminEmail);
        approval.setReviewedAt(LocalDateTime.now());
        approval.setComments(comments != null ? comments : "Approved by admin");
        productApprovalRepository.save(approval);

        logActivity(adminEmail, "APPROVE_PRODUCT", "Product", String.valueOf(productId), "Approved product: " + product.getName() + " (" + productId + ")");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Product approved successfully");
        return res;
    }

    @Transactional
    public Map<String, Object> rejectProduct(Long productId, String adminEmail, String comments) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        product.setStatus("REJECTED");
        productRepository.save(product);

        ProductApproval approval = productApprovalRepository.findByProductId(productId).orElse(new ProductApproval());
        approval.setProductId(productId);
        approval.setStatus("REJECTED");
        approval.setReviewedBy(adminEmail);
        approval.setReviewedAt(LocalDateTime.now());
        approval.setComments(comments != null ? comments : "Rejected by admin");
        productApprovalRepository.save(approval);

        logActivity(adminEmail, "REJECT_PRODUCT", "Product", String.valueOf(productId), "Rejected product: " + product.getName() + " (" + productId + "). Reason: " + approval.getComments());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Product rejected successfully");
        return res;
    }

    @Transactional(readOnly = true)
    public List<Order> getOrders(String status, String search) {
        List<Order> orders;
        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("all")) {
            orders = orderRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc(status);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }

        if (search == null || search.trim().isEmpty()) {
            return orders;
        }

        String q = search.toLowerCase();
        return orders.stream().filter(o -> {
            boolean idMatch = String.valueOf(o.getId()).contains(q);
            boolean custNameMatch = o.getCustomer() != null && o.getCustomer().getName() != null && o.getCustomer().getName().toLowerCase().contains(q);
            boolean custEmailMatch = o.getCustomer() != null && o.getCustomer().getEmail() != null && o.getCustomer().getEmail().toLowerCase().contains(q);
            return idMatch || custNameMatch || custEmailMatch;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String status, String adminEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        String oldStatus = order.getStatus();
        order.setStatus(status);
        orderRepository.save(order);

        logActivity(adminEmail, "UPDATE_ORDER_STATUS", "Order", String.valueOf(orderId), "Updated order status from " + oldStatus + " to " + status);
        return order;
    }

    @Transactional
    public List<SupportTicket> getSupportTickets() {
        initDefaultSupportTickets();
        List<SupportTicket> tickets = supportTicketRepository.findAll();
        tickets.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        return tickets;
    }

    @Transactional
    public SupportTicket resolveTicket(Long ticketId, String status, String adminEmail, String response) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found with id: " + ticketId));

        ticket.setStatus(status != null && !status.isEmpty() ? status : "RESOLVED");
        supportTicketRepository.save(ticket);

        logActivity(adminEmail, "RESOLVE_TICKET", "SupportTicket", String.valueOf(ticketId), "Resolved ticket #" + ticketId + " with status: " + ticket.getStatus() + ". Response: " + response);
        return ticket;
    }

    @Transactional(readOnly = true)
    public List<AdminActivityLog> getActivityLogs() {
        return adminActivityLogRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional(readOnly = true)
    public List<SystemReport> getReports() {
        return systemReportRepository.findAllByOrderByGeneratedAtDesc();
    }

    @Transactional
    public SystemReport generateReport(String title, String type, String adminEmail) {
        SystemReport report = new SystemReport();
        report.setTitle(title != null && !title.isEmpty() ? title : "System Report - " + type);
        report.setReportType(type != null ? type.toUpperCase() : "GENERAL");
        report.setGeneratedBy(adminEmail);
        report.setGeneratedAt(LocalDateTime.now());
        report.setStatus("COMPLETED");

        // Generate summary data
        Map<String, Object> summary = new HashMap<>();
        if ("SALES".equalsIgnoreCase(type)) {
            summary.put("totalOrders", orderRepository.count());
            double rev = orderRepository.findAll().stream()
                    .filter(o -> !o.getStatus().equalsIgnoreCase("cancelled"))
                    .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                    .sum();
            summary.put("totalRevenue", rev);
        } else if ("USERS".equalsIgnoreCase(type)) {
            summary.put("totalFarmers", userRepository.countByRoleIgnoreCase("farmer"));
            summary.put("totalCustomers", userRepository.countByRoleIgnoreCase("customer"));
            summary.put("blockedUsersCount", blockedUserRepository.count());
        } else if ("PRODUCTS".equalsIgnoreCase(type)) {
            summary.put("totalProducts", productRepository.count());
            summary.put("pendingApprovals", productApprovalRepository.countByStatusIgnoreCase("PENDING"));
        } else {
            summary.put("timestamp", LocalDateTime.now().toString());
            summary.put("status", "System healthy");
        }
        report.setSummaryData(summary);
        systemReportRepository.save(report);

        logActivity(adminEmail, "GENERATE_REPORT", "SystemReport", String.valueOf(report.getId()), "Generated report: " + report.getTitle());
        return report;
    }
}
