package com.farmigo.service;

import com.farmigo.dto.CheckoutRequest;
import com.farmigo.entity.*;
import com.farmigo.exception.ResourceNotFoundException;
import com.farmigo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerOrders(Long customerId) {
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("orders", orders);
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("order", order);
        return res;
    }

    @Transactional
    public Map<String, Object> checkout(Long customerId, CheckoutRequest req) {
        if (req.getShippingAddress() == null || req.getShippingAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping address is required");
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        List<CartItem> cartItems = cartItemRepository.findByCustomerId(customerId);
        if (cartItems == null || cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        double totalAmount = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product == null) continue;

            double subtotal = product.getPrice() * item.getQuantity();
            totalAmount += subtotal;

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .name(product.getName())
                    .price(product.getPrice())
                    .image(product.getImageUrl())
                    .quantity(item.getQuantity())
                    .farmer(product.getFarmer())
                    .farmerName(product.getFarmer() != null ? product.getFarmer().getName() : "Unknown Farmer")
                    .build();
            orderItems.add(orderItem);

            if (product.getQuantity() >= item.getQuantity()) {
                product.setQuantity(product.getQuantity() - item.getQuantity());
            } else {
                product.setQuantity(0);
            }
            productRepository.save(product);
        }

        double deliveryFee = 40.0;
        LocalDateTime deliveryDate = LocalDateTime.now().plusDays(3);

        Order order = Order.builder()
                .customer(customer)
                .totalAmount(totalAmount)
                .deliveryFee(deliveryFee)
                .shippingAddress(req.getShippingAddress())
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "cod")
                .deliveryDate(deliveryDate)
                .status("pending")
                .trackingInfo("Order placed. Preparing for shipment.")
                .build();

        for (OrderItem oi : orderItems) {
            oi.setOrder(order);
        }
        order.setItems(orderItems);

        orderRepository.save(order);
        cartItemRepository.deleteByCustomerId(customerId);

        // Generate Customer Notification
        notificationRepository.save(Notification.builder()
                .user(customer)
                .title("Order Placed Successfully")
                .message("Order placed successfully.")
                .build());

        // Generate Farmer Notifications
        Set<User> notifiedFarmers = new HashSet<>();
        for (OrderItem oi : orderItems) {
            User farmer = oi.getFarmer();
            if (farmer != null && notifiedFarmers.add(farmer)) {
                notificationRepository.save(Notification.builder()
                        .user(farmer)
                        .title("New Order Received 📦")
                        .message("You have received a new order for " + oi.getName() + " and potentially other items.")
                        .build());
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Order placed successfully.");
        res.put("order", order);
        return res;
    }

    @Transactional
    public Map<String, Object> cancelOrder(Long customerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Not authorized");
        }

        if ("shipped".equalsIgnoreCase(order.getStatus()) || "delivered".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Cannot cancel this order");
        }

        order.setStatus("cancelled");
        orderRepository.save(order);

        // Notify Customer
        notificationRepository.save(Notification.builder()
                .user(order.getCustomer())
                .title("Order Cancelled")
                .message("Your order #" + order.getId() + " has been successfully cancelled.")
                .build());

        // Notify Farmers
        Set<User> notifiedFarmers = new HashSet<>();
        for (OrderItem oi : order.getItems()) {
            User farmer = oi.getFarmer();
            if (farmer != null && notifiedFarmers.add(farmer)) {
                notificationRepository.save(Notification.builder()
                        .user(farmer)
                        .title("Order Cancelled ❌")
                        .message("Order #" + order.getId() + " containing your products was cancelled by the customer.")
                        .build());
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Order cancelled");
        res.put("order", order);
        return res;
    }

    @Transactional
    public Map<String, Object> confirmDelivery(Long customerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Not authorized");
        }

        if ("cancelled".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Cannot deliver a cancelled order");
        }

        order.setStatus("delivered");
        order.setDeliveryDate(LocalDateTime.now());
        orderRepository.save(order);

        // Notify Customer
        notificationRepository.save(Notification.builder()
                .user(order.getCustomer())
                .title("Order Delivered")
                .message("You confirmed delivery for order #" + order.getId() + ".")
                .build());

        // Notify Farmers
        Set<User> notifiedFarmers = new HashSet<>();
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                User farmer = oi.getFarmer();
                if (farmer != null && notifiedFarmers.add(farmer)) {
                    notificationRepository.save(Notification.builder()
                            .user(farmer)
                            .title("Order Delivered 📦")
                            .message("Customer confirmed delivery for order #" + order.getId() + ".")
                            .build());
                }
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Order marked as delivered");
        res.put("order", order);
        return res;
    }

    @Transactional
    public void autoDeliverOrder(Long orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if ("pending".equalsIgnoreCase(order.getStatus())) {
                order.setStatus("delivered");
                orderRepository.save(order);

                // Notification for Customer
                if (order.getCustomer() != null) {
                    notificationRepository.save(Notification.builder()
                            .user(order.getCustomer())
                            .title("Order Delivered")
                            .message("Your order has been delivered successfully.")
                            .build());
                }

                // Notify Farmers
                Set<User> notifiedFarmers = new HashSet<>();
                if (order.getItems() != null) {
                    for (OrderItem oi : order.getItems()) {
                        User farmer = oi.getFarmer();
                        if (farmer != null && notifiedFarmers.add(farmer)) {
                            notificationRepository.save(Notification.builder()
                                    .user(farmer)
                                    .title("Order Delivered 📦")
                                    .message("Order #" + order.getId() + " has been automatically delivered.")
                                    .build());
                        }
                    }
                }
            }
        });
    }
}
