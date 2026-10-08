package com.farmigo.service;

import com.farmigo.entity.Product;
import com.farmigo.entity.User;
import com.farmigo.entity.WishlistItem;
import com.farmigo.exception.ResourceNotFoundException;
import com.farmigo.repository.ProductRepository;
import com.farmigo.repository.UserRepository;
import com.farmigo.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getWishlist(Long customerId) {
        List<WishlistItem> items = wishlistItemRepository.findByCustomerId(customerId);
        List<Map<String, Object>> products = items.stream()
                .map(WishlistItem::getProduct)
                .filter(Objects::nonNull)
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("_id", p.getId());
                    map.put("id", p.getId());
                    map.put("name", p.getName());
                    map.put("price", p.getPrice());
                    map.put("unit", p.getUnit());
                    map.put("imageUrl", p.getImageUrl());
                    map.put("category", p.getCategory());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("wishlist", products);
        return res;
    }

    @Transactional
    public Map<String, Object> toggleWishlist(Long customerId, Long productId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Optional<WishlistItem> existingOpt = wishlistItemRepository.findByCustomerIdAndProductId(customerId, productId);
        boolean inWishlist;
        String message;

        if (existingOpt.isPresent()) {
            wishlistItemRepository.delete(existingOpt.get());
            inWishlist = false;
            message = "Removed from wishlist";
        } else {
            WishlistItem item = WishlistItem.builder()
                    .customer(customer)
                    .product(product)
                    .build();
            wishlistItemRepository.save(item);
            inWishlist = true;
            message = "Added to wishlist! ❤️";
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", message);
        res.put("inWishlist", inWishlist);
        return res;
    }

    @Transactional
    public Map<String, Object> removeFromWishlist(Long customerId, Long productId) {
        wishlistItemRepository.deleteByCustomerIdAndProductId(customerId, productId);
        return getWishlist(customerId);
    }
}
