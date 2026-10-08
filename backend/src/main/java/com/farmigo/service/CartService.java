package com.farmigo.service;

import com.farmigo.entity.CartItem;
import com.farmigo.entity.Product;
import com.farmigo.entity.User;
import com.farmigo.exception.ResourceNotFoundException;
import com.farmigo.repository.CartItemRepository;
import com.farmigo.repository.ProductRepository;
import com.farmigo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getCart(Long customerId) {
        List<CartItem> items = cartItemRepository.findByCustomerId(customerId);
        return buildCartResponse(items);
    }

    @Transactional
    public Map<String, Object> addItem(Long customerId, Long productId, Integer quantity) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Optional<CartItem> existingOpt = cartItemRepository.findByCustomerIdAndProductId(customerId, productId);
        if (existingOpt.isPresent()) {
            CartItem item = existingOpt.get();
            item.setQuantity(item.getQuantity() + (quantity != null ? quantity : 1));
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .customer(customer)
                    .product(product)
                    .quantity(quantity != null ? quantity : 1)
                    .build();
            cartItemRepository.save(item);
        }

        List<CartItem> items = cartItemRepository.findByCustomerId(customerId);
        return buildCartResponse(items);
    }

    @Transactional
    public Map<String, Object> updateQuantity(Long customerId, Long itemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Not authorized");
        }

        if (quantity != null && quantity > 0) {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        } else {
            cartItemRepository.delete(item);
        }

        List<CartItem> items = cartItemRepository.findByCustomerId(customerId);
        return buildCartResponse(items);
    }

    @Transactional
    public Map<String, Object> removeItem(Long customerId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Not authorized");
        }

        cartItemRepository.delete(item);

        List<CartItem> items = cartItemRepository.findByCustomerId(customerId);
        return buildCartResponse(items);
    }

    @Transactional
    public Map<String, Object> clearCart(Long customerId) {
        cartItemRepository.deleteByCustomerId(customerId);
        return buildCartResponse(Collections.emptyList());
    }

    private Map<String, Object> buildCartResponse(List<CartItem> items) {
        double total = 0;
        int itemCount = 0;
        List<Map<String, Object>> itemMaps = new ArrayList<>();

        for (CartItem item : items) {
            if (item.getProduct() == null) continue;
            Product p = item.getProduct();
            double subtotal = p.getPrice() * item.getQuantity();
            total += subtotal;
            itemCount += item.getQuantity();

            Map<String, Object> productMap = new HashMap<>();
            productMap.put("_id", p.getId());
            productMap.put("id", p.getId());
            productMap.put("name", p.getName());
            productMap.put("price", p.getPrice());
            productMap.put("unit", p.getUnit());
            productMap.put("imageUrl", p.getImageUrl());
            productMap.put("category", p.getCategory());
            
            if (p.getFarmer() != null) {
                Map<String, Object> farmerMap = new HashMap<>();
                farmerMap.put("name", p.getFarmer().getName());
                productMap.put("farmer", farmerMap);
            }

            Map<String, Object> map = new HashMap<>();
            map.put("_id", item.getId());
            map.put("id", item.getId());
            map.put("product", productMap);
            map.put("quantity", item.getQuantity());
            itemMaps.add(map);
        }

        Map<String, Object> cartObj = new HashMap<>();
        cartObj.put("items", itemMaps);
        cartObj.put("total", total);
        cartObj.put("itemCount", itemCount);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("cart", cartObj);
        return res;
    }
}
