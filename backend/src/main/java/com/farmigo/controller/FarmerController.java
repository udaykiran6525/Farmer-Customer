package com.farmigo.controller;

import com.farmigo.dto.OrderStatusRequest;
import com.farmigo.security.UserPrincipal;
import com.farmigo.service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;

    @GetMapping({"/dashboard", "/stats"})
    public ResponseEntity<Map<String, Object>> getFarmerStats(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(farmerService.getFarmerStats(userPrincipal.getId()));
    }

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> getFarmerOrders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(farmerService.getFarmerOrders(userPrincipal.getId()));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                 @PathVariable Long id,
                                                                 @RequestBody OrderStatusRequest req) {
        return ResponseEntity.ok(farmerService.updateOrderStatus(userPrincipal.getId(), id, req.getStatus()));
    }
}
