package com.farmigo.service;

import com.farmigo.entity.Order;
import com.farmigo.entity.OrderItem;
import com.farmigo.entity.Product;
import com.farmigo.exception.ResourceNotFoundException;
import com.farmigo.repository.OrderItemRepository;
import com.farmigo.repository.OrderRepository;
import com.farmigo.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final com.farmigo.repository.NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getFarmerStats(Long farmerId) {
        List<Product> products = productRepository.findByFarmerId(farmerId);
        int totalProducts = products.size();
        long availableProducts = products.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsAvailable()) && p.getQuantity() != null && p.getQuantity() > 0)
                .count();

        List<OrderItem> orderItems = orderItemRepository.findByFarmerIdOrderByOrderCreatedAtDesc(farmerId);
        
        // Group OrderItems by Order ID
        Map<Long, List<OrderItem>> orderItemsByOrderId = new LinkedHashMap<>();
        for (OrderItem oi : orderItems) {
            if (oi.getOrder() == null) continue;
            orderItemsByOrderId.computeIfAbsent(oi.getOrder().getId(), k -> new ArrayList<>()).add(oi);
        }

        int totalOrders = orderItemsByOrderId.size();
        int pendingOrders = 0;
        int processingOrders = 0;
        int deliveredOrders = 0;
        int cancelledOrders = 0;
        double totalRevenue = 0.0;

        List<Map<String, Object>> recentOrders = new ArrayList<>();

        for (Map.Entry<Long, List<OrderItem>> entry : orderItemsByOrderId.entrySet()) {
            List<OrderItem> items = entry.getValue();
            Order order = items.get(0).getOrder();
            String status = order.getStatus() != null ? order.getStatus().toLowerCase() : "pending";

            double orderFarmerRevenue = 0.0;
            for (OrderItem oi : items) {
                double p = oi.getPrice() != null ? oi.getPrice() : 0.0;
                int q = oi.getQuantity() != null ? oi.getQuantity() : 1;
                orderFarmerRevenue += (p * q);
            }

            if ("pending".equals(status)) {
                pendingOrders++;
            } else if ("delivered".equals(status)) {
                deliveredOrders++;
            } else if ("cancelled".equals(status)) {
                cancelledOrders++;
            } else {
                processingOrders++;
            }

            if (!"cancelled".equals(status)) {
                totalRevenue += orderFarmerRevenue;
            }

            if (recentOrders.size() < 10) {
                recentOrders.add(formatOrderForFarmer(order, items, orderFarmerRevenue));
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts", totalProducts);
        stats.put("availableProducts", availableProducts);
        stats.put("activeProducts", availableProducts);
        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("processingOrders", processingOrders);
        stats.put("deliveredOrders", deliveredOrders);
        stats.put("cancelledOrders", cancelledOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("recentOrders", recentOrders);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("stats", stats);
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFarmerOrders(Long farmerId) {
        List<OrderItem> orderItems = orderItemRepository.findByFarmerIdOrderByOrderCreatedAtDesc(farmerId);
        
        Map<Long, List<OrderItem>> orderItemsByOrderId = new LinkedHashMap<>();
        for (OrderItem oi : orderItems) {
            if (oi.getOrder() == null) continue;
            orderItemsByOrderId.computeIfAbsent(oi.getOrder().getId(), k -> new ArrayList<>()).add(oi);
        }

        List<Map<String, Object>> ordersList = new ArrayList<>();
        for (Map.Entry<Long, List<OrderItem>> entry : orderItemsByOrderId.entrySet()) {
            List<OrderItem> items = entry.getValue();
            Order order = items.get(0).getOrder();
            double farmerSubtotal = 0.0;
            for (OrderItem oi : items) {
                double p = oi.getPrice() != null ? oi.getPrice() : 0.0;
                int q = oi.getQuantity() != null ? oi.getQuantity() : 1;
                farmerSubtotal += (p * q);
            }
            ordersList.add(formatOrderForFarmer(order, items, farmerSubtotal));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("orders", ordersList);
        return res;
    }

    private Map<String, Object> formatOrderForFarmer(Order order, List<OrderItem> items, double farmerSubtotal) {
        Map<String, Object> map = new HashMap<>();
        map.put("_id", order.getId());
        map.put("id", order.getId());
        map.put("orderId", order.getId());
        
        OrderItem primaryItem = items.get(0);
        String primaryImg = primaryItem.getImage() != null && !primaryItem.getImage().isEmpty() ? 
                primaryItem.getImage() : (primaryItem.getProduct() != null ? primaryItem.getProduct().getImage() : "");
        map.put("productImage", primaryImg);
        map.put("image", primaryImg);

        String prodName = primaryItem.getName() != null ? primaryItem.getName() : 
                (primaryItem.getProduct() != null ? primaryItem.getProduct().getName() : "Product");
        if (items.size() > 1) {
            prodName = prodName + " (+" + (items.size() - 1) + " more)";
        }
        map.put("productName", prodName);
        map.put("price", primaryItem.getPrice() != null ? primaryItem.getPrice() : 0.0);
        
        int totalQty = items.stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 1).sum();
        map.put("quantity", totalQty);
        map.put("unit", primaryItem.getProduct() != null && primaryItem.getProduct().getUnit() != null ? primaryItem.getProduct().getUnit() : "kg");
        map.put("totalAmount", farmerSubtotal);

        Map<String, Object> custMap = new HashMap<>();
        if (order.getCustomer() != null) {
            custMap.put("name", order.getCustomer().getName() != null ? order.getCustomer().getName() : "Customer");
            custMap.put("phone", order.getCustomer().getPhone() != null ? order.getCustomer().getPhone() : "N/A");
            custMap.put("email", order.getCustomer().getEmail() != null ? order.getCustomer().getEmail() : "");
        } else {
            custMap.put("name", "Customer");
            custMap.put("phone", "N/A");
            custMap.put("email", "");
        }
        map.put("customer", custMap);
        map.put("status", order.getStatus() != null ? order.getStatus().toLowerCase() : "pending");
        map.put("shippingAddress", order.getShippingAddress() != null ? order.getShippingAddress() : "N/A");
        map.put("paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod() : "cod");

        String payStatus = "Paid";
        if ("cod".equalsIgnoreCase(order.getPaymentMethod()) && !"delivered".equalsIgnoreCase(order.getStatus())) {
            payStatus = "Pending COD";
        }
        map.put("paymentStatus", payStatus);
        map.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : LocalDateTime.now().toString());

        List<Map<String, Object>> itemsList = new ArrayList<>();
        for (OrderItem oi : items) {
            Map<String, Object> itemMap = new HashMap<>();
            String itemImg = oi.getImage() != null && !oi.getImage().isEmpty() ? oi.getImage() : 
                    (oi.getProduct() != null ? oi.getProduct().getImage() : "");
            itemMap.put("name", oi.getName() != null ? oi.getName() : "Product");
            itemMap.put("quantity", oi.getQuantity() != null ? oi.getQuantity() : 1);
            itemMap.put("unit", oi.getProduct() != null && oi.getProduct().getUnit() != null ? oi.getProduct().getUnit() : "kg");
            itemMap.put("price", oi.getPrice() != null ? oi.getPrice() : 0.0);
            itemMap.put("image", itemImg);
            itemsList.add(itemMap);
        }
        map.put("items", itemsList);

        return map;
    }

    @Transactional
    public Map<String, Object> updateOrderStatus(Long farmerId, Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Farmer data security: verify that order contains products belonging to this farmer
        boolean belongsToFarmer = orderItemRepository.findByFarmerIdOrderByOrderCreatedAtDesc(farmerId)
                .stream().anyMatch(oi -> oi.getOrder() != null && oi.getOrder().getId().equals(orderId));
        if (!belongsToFarmer) {
            throw new IllegalArgumentException("Unauthorized: Order does not contain produce from your farm.");
        }

        order.setStatus(status.toLowerCase());
        if ("delivered".equalsIgnoreCase(status)) {
            order.setDeliveryDate(LocalDateTime.now());
        }
        orderRepository.save(order);

        if (order.getCustomer() != null) {
            String title = "Order Update: " + status.substring(0, 1).toUpperCase() + status.substring(1);
            notificationRepository.save(com.farmigo.entity.Notification.builder()
                    .user(order.getCustomer())
                    .title(title)
                    .message("Your order #" + order.getId() + " is now " + status + ".")
                    .build());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Order status updated to " + status);
        res.put("order", order);
        return res;
    }
}
