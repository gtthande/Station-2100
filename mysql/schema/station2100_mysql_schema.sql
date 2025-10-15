-- Station-2100 MySQL Shadow Database Schema
-- Generated from Supabase PostgreSQL schema
-- Database: station2100_mysql_shadow

SET FOREIGN_KEY_CHECKS = 0;

-- Users table (from auth.users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email_confirmed_at` DATETIME NULL,
  `last_sign_in_at` DATETIME NULL,
  `raw_app_meta_data` JSON NULL,
  `raw_user_meta_data` JSON NULL,
  `is_super_admin` BOOLEAN DEFAULT FALSE,
  `confirmation_token` VARCHAR(255) NULL,
  `recovery_token` VARCHAR(255) NULL,
  `email_change_token` VARCHAR(255) NULL,
  `email_change` VARCHAR(255) NULL,
  `phone` VARCHAR(15) NULL,
  `phone_confirmed_at` DATETIME NULL,
  `phone_change` VARCHAR(15) NULL,
  `phone_change_token` VARCHAR(255) NULL,
  `confirmed_at` DATETIME NULL,
  `email_change_confirm_status` SMALLINT DEFAULT 0,
  `banned_until` DATETIME NULL,
  `re_authentication_token` VARCHAR(255) NULL,
  `re_authentication_sent_at` DATETIME NULL,
  `is_sso_user` BOOLEAN DEFAULT FALSE,
  `deleted_at` DATETIME NULL,
  `is_anonymous` BOOLEAN DEFAULT FALSE,
  `encrypted_password` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles table
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NULL,
  `position` VARCHAR(255) NULL,
  `is_staff` BOOLEAN DEFAULT FALSE,
  `staff_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_profiles_user_id` (`user_id`),
  INDEX `idx_profiles_email` (`email`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User roles table
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `role_name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_roles_user_id` (`user_id`),
  INDEX `idx_user_roles_role_name` (`role_name`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom roles table
CREATE TABLE IF NOT EXISTS `custom_roles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `role_name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `permissions` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company details table
CREATE TABLE IF NOT EXISTS `company_details` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `website` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_company_details_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `aircraft_type` VARCHAR(100) NULL,
  `tail_number` VARCHAR(20) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_user_id` (`user_id`),
  INDEX `idx_customers_name` (`name`),
  INDEX `idx_customers_email` (`email`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer permissions table
CREATE TABLE IF NOT EXISTS `customer_permissions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NOT NULL,
  `permission_level` ENUM('admin', 'manage', 'view_full', 'view_contact', 'view_basic') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_customer_permissions_user_id` (`user_id`),
  INDEX `idx_customer_permissions_customer_id` (`customer_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory products table
CREATE TABLE IF NOT EXISTS `inventory_products` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `part_number` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `unit_cost` DECIMAL(10,2) DEFAULT 0.00,
  `unit_of_measure` VARCHAR(50) NULL,
  `category` VARCHAR(100) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_inventory_products_user_id` (`user_id`),
  INDEX `idx_inventory_products_part_number` (`part_number`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory batches table
CREATE TABLE IF NOT EXISTS `inventory_batches` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `batch_number` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `expiry_date` DATE NULL,
  `supplier` VARCHAR(255) NULL,
  `cost_per_unit` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_inventory_batches_user_id` (`user_id`),
  INDEX `idx_inventory_batches_product_id` (`product_id`),
  INDEX `idx_inventory_batches_batch_number` (`batch_number`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `inventory_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job cards table
CREATE TABLE IF NOT EXISTS `job_cards` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('draft', 'pending', 'approved', 'active', 'completed', 'cancelled') DEFAULT 'draft',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `assigned_to` VARCHAR(36) NULL,
  `aircraft_type` VARCHAR(100) NULL,
  `tail_number` VARCHAR(20) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_job_cards_user_id` (`user_id`),
  INDEX `idx_job_cards_customer_id` (`customer_id`),
  INDEX `idx_job_cards_assigned_to` (`assigned_to`),
  INDEX `idx_job_cards_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job card items table
CREATE TABLE IF NOT EXISTS `job_card_items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `job_card_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NULL,
  `batch_id` VARCHAR(36) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_cost` DECIMAL(10,2) DEFAULT 0.00,
  `description` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_job_card_items_job_card_id` (`job_card_id`),
  INDEX `idx_job_card_items_product_id` (`product_id`),
  INDEX `idx_job_card_items_batch_id` (`batch_id`),
  FOREIGN KEY (`job_card_id`) REFERENCES `job_cards`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `inventory_products`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rotable parts table
CREATE TABLE IF NOT EXISTS `rotable_parts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `part_number` VARCHAR(100) NOT NULL,
  `serial_number` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `status` ENUM('serviceable', 'in_service', 'repair', 'scrapped') DEFAULT 'serviceable',
  `location` VARCHAR(255) NULL,
  `hours_since_overhaul` INT DEFAULT 0,
  `cycles_since_overhaul` INT DEFAULT 0,
  `last_inspection_date` DATE NULL,
  `next_inspection_date` DATE NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_rotable_parts_user_id` (`user_id`),
  INDEX `idx_rotable_parts_part_number` (`part_number`),
  INDEX `idx_rotable_parts_serial_number` (`serial_number`),
  INDEX `idx_rotable_parts_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rotable installations table
CREATE TABLE IF NOT EXISTS `rotable_installations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `rotable_part_id` VARCHAR(36) NOT NULL,
  `aircraft_type` VARCHAR(100) NULL,
  `tail_number` VARCHAR(20) NULL,
  `position` VARCHAR(100) NULL,
  `installed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `removed_at` DATETIME NULL,
  `hours_at_installation` INT DEFAULT 0,
  `cycles_at_installation` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rotable_installations_rotable_part_id` (`rotable_part_id`),
  INDEX `idx_rotable_installations_tail_number` (`tail_number`),
  FOREIGN KEY (`rotable_part_id`) REFERENCES `rotable_parts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tools table
CREATE TABLE IF NOT EXISTS `tools` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `tool_name` VARCHAR(255) NOT NULL,
  `tool_number` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `location` VARCHAR(255) NULL,
  `status` ENUM('available', 'checked_out', 'maintenance', 'retired') DEFAULT 'available',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tools_user_id` (`user_id`),
  INDEX `idx_tools_tool_name` (`tool_name`),
  INDEX `idx_tools_tool_number` (`tool_number`),
  INDEX `idx_tools_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tool checkouts table
CREATE TABLE IF NOT EXISTS `tool_checkouts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `tool_id` VARCHAR(36) NOT NULL,
  `checked_out_by` VARCHAR(36) NOT NULL,
  `checked_out_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `returned_at` DATETIME NULL,
  `notes` TEXT NULL,
  INDEX `idx_tool_checkouts_tool_id` (`tool_id`),
  INDEX `idx_tool_checkouts_checked_out_by` (`checked_out_by`),
  FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`checked_out_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exchange rates table
CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `from_currency` VARCHAR(3) NOT NULL,
  `to_currency` VARCHAR(3) NOT NULL,
  `rate` DECIMAL(10,6) NOT NULL,
  `date` DATE NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_exchange_rates_from_currency` (`from_currency`),
  INDEX `idx_exchange_rates_to_currency` (`to_currency`),
  INDEX `idx_exchange_rates_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,
  `table_name` VARCHAR(100) NULL,
  `record_id` VARCHAR(36) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_logs_user_id` (`user_id`),
  INDEX `idx_audit_logs_action` (`action`),
  INDEX `idx_audit_logs_table_name` (`table_name`),
  INDEX `idx_audit_logs_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock movements table
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `batch_id` VARCHAR(36) NULL,
  `movement_type` ENUM('in', 'out', 'transfer', 'adjustment') NOT NULL,
  `quantity` INT NOT NULL,
  `unit_cost` DECIMAL(10,2) DEFAULT 0.00,
  `reference` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_stock_movements_user_id` (`user_id`),
  INDEX `idx_stock_movements_product_id` (`product_id`),
  INDEX `idx_stock_movements_batch_id` (`batch_id`),
  INDEX `idx_stock_movements_movement_type` (`movement_type`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `inventory_products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profile security log table
CREATE TABLE IF NOT EXISTS `profile_security_log` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_profile_security_log_user_id` (`user_id`),
  INDEX `idx_profile_security_log_action` (`action`),
  INDEX `idx_profile_security_log_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Create indexes for better performance
CREATE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_created_at` ON `users`(`created_at`);
CREATE INDEX `idx_customers_created_at` ON `customers`(`created_at`);
CREATE INDEX `idx_inventory_products_created_at` ON `inventory_products`(`created_at`);
CREATE INDEX `idx_job_cards_created_at` ON `job_cards`(`created_at`);
CREATE INDEX `idx_rotable_parts_created_at` ON `rotable_parts`(`created_at`);
CREATE INDEX `idx_tools_created_at` ON `tools`(`created_at`);
CREATE INDEX `idx_audit_logs_created_at` ON `audit_logs`(`created_at`);

-- End of schema