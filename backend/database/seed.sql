-- =========================================================
-- Farmigo Production MySQL Database Seed Data
-- =========================================================

USE `farmigo_db`;

-- Seed Default Admin Account (Password: admin123 hashed with BCrypt)
INSERT INTO `users` (`name`, `email`, `password`, `phone`, `role`, `profile_image`, `state`, `district`, `village`)
VALUES ('Farmigo Admin', 'admin@farmigo.com', '$2a$10$e7Z8t4kSg6s3xYx5U9N5ueZ7xV5Qy1K1F0a.W.d8KzP4aB1g3J5e.', '9876543210', 'admin', 'https://ui-avatars.com/api/?name=Farmigo+Admin&background=16a34a&color=fff', 'Telangana', 'Hyderabad', 'City Center')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Seed Sample Active Farmer
INSERT INTO `users` (`name`, `email`, `password`, `phone`, `role`, `profile_image`, `state`, `district`, `village`, `farm_name`, `farm_size`)
VALUES ('Ramesh Kumar', 'ramesh@farmigo.com', '$2a$10$e7Z8t4kSg6s3xYx5U9N5ueZ7xV5Qy1K1F0a.W.d8KzP4aB1g3J5e.', '9123456789', 'farmer', 'https://ui-avatars.com/api/?name=Ramesh+Kumar&background=f97316&color=fff', 'Telangana', 'Warangal', 'Green Village', 'Sunrise Organic Farm', '5 Acres')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Seed Farmer Profile Link
INSERT INTO `farmers` (`user_id`, `name`, `village`, `district`, `state`, `mobile`, `profile_image`, `status`)
SELECT `id`, `name`, `village`, `district`, `state`, `phone`, `profile_image`, 'active'
FROM `users` WHERE `email` = 'ramesh@farmigo.com'
ON DUPLICATE KEY UPDATE `id`=`id`;
