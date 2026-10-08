package com.farmigo.controller;

import com.farmigo.dto.CartItemRequest;
import com.farmigo.security.UserPrincipal;
import com.farmigo.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(cartService.getCart(userPrincipal.getId()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addItem(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                       @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.addItem(userPrincipal.getId(), req.getProductId(), req.getQuantity()));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> updateQuantity(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                              @PathVariable Long itemId,
                                                              @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.updateQuantity(userPrincipal.getId(), itemId, req.getQuantity()));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> removeItem(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                          @PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItem(userPrincipal.getId(), itemId));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(cartService.clearCart(userPrincipal.getId()));
    }
}
