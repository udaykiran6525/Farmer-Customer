package com.farmigo.controller;

import com.farmigo.dto.CheckoutRequest;
import com.farmigo.security.UserPrincipal;
import com.farmigo.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCustomerOrders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(orderService.getCustomerOrders(userPrincipal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                        @RequestBody CheckoutRequest req) {
        return ResponseEntity.ok(orderService.checkout(userPrincipal.getId(), req));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                           @PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(userPrincipal.getId(), id));
    }

    // Alias for updating order status if customer/admin needs it, mapping to farmerService or similar logic
    // We will just map it to OrderService to keep it clean (e.g., customer canceling)
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                 @PathVariable Long id,
                                                                 @RequestBody Map<String, String> req) {
        // We can just use the cancel logic or if we add more customer actions later. 
        // For farmers, they use /api/farmer/orders/{id}/status.
        if ("cancelled".equalsIgnoreCase(req.get("status"))) {
            return ResponseEntity.ok(orderService.cancelOrder(userPrincipal.getId(), id));
        } else if ("delivered".equalsIgnoreCase(req.get("status"))) {
            return ResponseEntity.ok(orderService.confirmDelivery(userPrincipal.getId(), id));
        }
        throw new IllegalArgumentException("Invalid status update for customer: " + req.get("status"));
    }
}
