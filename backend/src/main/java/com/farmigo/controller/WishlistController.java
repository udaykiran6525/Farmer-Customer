package com.farmigo.controller;

import com.farmigo.security.UserPrincipal;
import com.farmigo.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWishlist(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(wishlistService.getWishlist(userPrincipal.getId()));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> toggleWishlist(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                              @PathVariable Long productId) {
        return ResponseEntity.ok(wishlistService.toggleWishlist(userPrincipal.getId(), productId));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> removeFromWishlist(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                  @PathVariable Long productId) {
        return ResponseEntity.ok(wishlistService.removeFromWishlist(userPrincipal.getId(), productId));
    }
}
