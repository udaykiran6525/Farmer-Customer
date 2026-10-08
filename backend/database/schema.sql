-- =========================================================
-- Farmigo Production MySQL Database Schema DDL
-- Database Name: farmigo_db
-- Server Version: MySQL 8.x
-- =========================================================

CREATE DATABASE IF NOT EXISTS `farmigo_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `farmigo_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `role` VARCHAR(30) NOT NULL DEFAULT 'customer',
    `profile_image` VARCHAR(500),
    `state` VARCHAR(100),
    `district` VARCHAR(100),
    `village` VARCHAR(100),
    `address` VARCHAR(500),
    `city` VARCHAR(100),
    `pincode` VARCHAR(20),
    `farm_name` VARCHAR(100),
    `farm_size` VARCHAR(50),
    `language` VARCHAR(10) DEFAULT 'en',
    `bank_account_details` VARCHAR(500),
    `upi_id` VARCHAR(100),
    `two_factor_enabled` BOOLEAN DEFAULT FALSE,
    `time_zone` VARCHAR(100) DEFAULT 'Asia/Kolkata',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Farmers Table
CREATE TABLE IF NOT EXISTS `farmers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `village` VARCHAR(100),
    `district` VARCHAR(100),
    `state` VARCHAR(100),
    `mobile` VARCHAR(20),
    `profile_image` VARCHAR(500),
    `status` VARCHAR(30) DEFAULT 'active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_farmers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `address` TEXT,
    `mobile` VARCHAR(20),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Products Table
CREATE TABLE IF NOT EXISTS `products` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `farmer_id` BIGINT NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `price` DOUBLE NOT NULL,
    `original_price` DOUBLE,
    `discount` DOUBLE DEFAULT 15.0,
    `unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
    `quantity` INT NOT NULL DEFAULT 0,
    `description` TEXT,
    `image_url` VARCHAR(1000),
    `weight` VARCHAR(50),
    `shelf_life` VARCHAR(100),
    `harvest_date` VARCHAR(100),
    `is_organic` BOOLEAN DEFAULT FALSE,
    `ratings` DOUBLE DEFAULT 4.0,
    `review_count` INT DEFAULT 0,
    `status` VARCHAR(30) DEFAULT 'active',
    `is_available` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_products_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `delivery_fee` DOUBLE DEFAULT 40.0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `shipping_address` TEXT,
    `payment_method` VARCHAR(30) DEFAULT 'cod',
    `delivery_date` DATETIME,
    `tracking_info` VARCHAR(500),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `quantity` INT NOT NULL,
    `price` DOUBLE NOT NULL,
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Wishlist Items Table
CREATE TABLE IF NOT EXISTS `wishlist_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    CONSTRAINT `fk_wishlist_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Cart Items Table
CREATE TABLE IF NOT EXISTS `cart_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    CONSTRAINT `fk_cart_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `rating` DOUBLE NOT NULL,
    `review` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(200),
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) DEFAULT 'system',
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
