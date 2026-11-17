-- Nutrition & Diet Tracker - Complete Non-Destructive Database Schema
-- Compatible with MySQL 8.0+ / MySQL Workbench
-- Safe to run on an existing database: uses CREATE IF NOT EXISTS and avoids dropping existing data.

CREATE DATABASE IF NOT EXISTS nutrition_tracker
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nutrition_tracker;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Nutrition Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    daily_calories DECIMAL(10,2) NOT NULL DEFAULT 2000.00,
    daily_carbs DECIMAL(10,2) NOT NULL DEFAULT 250.00,
    daily_protein DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    daily_fat DECIMAL(10,2) NOT NULL DEFAULT 65.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_goals_user_id UNIQUE (user_id),
    CONSTRAINT fk_user_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Food Items / Food Catalog Table
CREATE TABLE IF NOT EXISTS food_catalog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    barcode VARCHAR(100) NULL,
    serving_unit VARCHAR(50) NOT NULL DEFAULT 'g',
    nutrition_basis VARCHAR(20) NOT NULL DEFAULT 'PER_100G',
    serving_size DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    calories DECIMAL(10,2) NOT NULL,
    carbohydrates DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    protein DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fat DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fiber DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sugar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_food_catalog_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_food_catalog_name (name),
    INDEX idx_food_catalog_barcode (barcode),
    INDEX idx_food_catalog_creator (created_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Food Logs Table
CREATE TABLE IF NOT EXISTS food_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    food_id BIGINT NULL,
    food_name VARCHAR(200) NOT NULL,
    consumed_quantity DECIMAL(10,2) NOT NULL,
    serving_unit VARCHAR(50) NOT NULL,
    calories DECIMAL(10,2) NOT NULL,
    carbohydrates DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    protein DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fat DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fiber DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sugar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    logged_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_logged_at UNIQUE (user_id, logged_at),
    CONSTRAINT fk_food_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_food_logs_food FOREIGN KEY (food_id) REFERENCES food_catalog(id) ON DELETE SET NULL,
    INDEX idx_user_logged_at (user_id, logged_at),
    INDEX idx_food_logs_food_id (food_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Standard Reference Foods (Idempotent seed: inserts only if missing by name)
INSERT INTO food_catalog (name, barcode, serving_unit, nutrition_basis, serving_size, calories, carbohydrates, protein, fat, fiber, sugar, is_custom)
SELECT * FROM (
    SELECT 'Chicken Breast (Raw)' AS name, NULL AS barcode, 'g' AS serving_unit, 'PER_100G' AS nutrition_basis, 100.00 AS serving_size, 165.00 AS calories, 0.00 AS carbohydrates, 31.00 AS protein, 3.60 AS fat, 0.00 AS fiber, 0.00 AS sugar, FALSE AS is_custom
    UNION ALL SELECT 'Brown Rice (Cooked)', NULL, 'g', 'PER_100G', 100.00, 112.00, 24.00, 2.60, 0.90, 1.80, 0.40, FALSE
    UNION ALL SELECT 'Rolled Oats', NULL, 'g', 'PER_100G', 100.00, 389.00, 66.00, 17.00, 7.00, 10.60, 1.00, FALSE
    UNION ALL SELECT 'Greek Yogurt (Plain Non-fat)', NULL, 'g', 'PER_100G', 100.00, 59.00, 3.60, 10.00, 0.40, 0.00, 3.20, FALSE
    UNION ALL SELECT 'Whole Egg (Large)', NULL, 'egg', 'PER_SERVING', 1.00, 72.00, 0.40, 6.30, 4.80, 0.00, 0.20, FALSE
    UNION ALL SELECT 'Banana (Fresh)', NULL, 'g', 'PER_100G', 100.00, 89.00, 23.00, 1.10, 0.30, 2.60, 12.20, FALSE
    UNION ALL SELECT 'Atlantic Salmon Fillet', NULL, 'g', 'PER_100G', 100.00, 208.00, 0.00, 20.00, 13.00, 0.00, 0.00, FALSE
    UNION ALL SELECT 'Broccoli (Fresh)', NULL, 'g', 'PER_100G', 100.00, 34.00, 7.00, 2.80, 0.40, 2.60, 1.70, FALSE
    UNION ALL SELECT 'Almonds (Raw)', NULL, 'g', 'PER_100G', 100.00, 579.00, 22.00, 21.00, 50.00, 12.50, 4.40, FALSE
    UNION ALL SELECT 'Whole Wheat Bread Slice', NULL, 'slice', 'PER_SERVING', 1.00, 69.00, 12.00, 4.00, 1.00, 2.00, 1.50, FALSE
    UNION ALL SELECT 'Sweet Potato (Baked)', NULL, 'g', 'PER_100G', 100.00, 90.00, 21.00, 2.00, 0.20, 3.30, 6.50, FALSE
    UNION ALL SELECT 'Black Beans (Cooked)', NULL, 'g', 'PER_100G', 100.00, 132.00, 24.00, 8.90, 0.50, 8.70, 0.30, FALSE
    UNION ALL SELECT 'Avocado (Fresh)', NULL, 'g', 'PER_100G', 100.00, 160.00, 8.50, 2.00, 15.00, 6.70, 0.70, FALSE
    UNION ALL SELECT 'Olive Oil (Extra Virgin)', NULL, 'ml', 'PER_100G', 100.00, 884.00, 0.00, 0.00, 100.00, 0.00, 0.00, FALSE
    UNION ALL SELECT 'Whole Milk', NULL, 'ml', 'PER_100G', 100.00, 61.00, 4.80, 3.20, 3.30, 0.00, 5.10, FALSE
    UNION ALL SELECT 'Peanut Butter (Smooth)', NULL, 'g', 'PER_100G', 100.00, 588.00, 20.00, 25.00, 50.00, 6.00, 9.00, FALSE
    UNION ALL SELECT 'Tofu (Firm)', NULL, 'g', 'PER_100G', 100.00, 76.00, 1.90, 8.00, 4.80, 0.30, 0.60, FALSE
    UNION ALL SELECT 'Apple (Fresh Red)', NULL, 'g', 'PER_100G', 100.00, 52.00, 14.00, 0.30, 0.20, 2.40, 10.40, FALSE
    UNION ALL SELECT 'Spinach (Fresh)', NULL, 'g', 'PER_100G', 100.00, 23.00, 3.60, 2.90, 0.40, 2.20, 0.40, FALSE
    UNION ALL SELECT 'Quinoa (Cooked)', NULL, 'g', 'PER_100G', 100.00, 120.00, 21.00, 4.40, 1.90, 2.80, 0.90, FALSE
    UNION ALL SELECT 'Nutella Hazelnut Spread', '3017620422003', 'g', 'PER_100G', 100.00, 539.00, 57.50, 6.30, 30.90, 3.00, 56.30, FALSE
    UNION ALL SELECT 'Coca-Cola Original Taste', '5449000000996', 'ml', 'PER_100G', 100.00, 42.00, 10.60, 0.00, 0.00, 0.00, 10.60, FALSE
    UNION ALL SELECT 'Oreo Original Sandwich Cookies', '7622210449283', 'g', 'PER_100G', 100.00, 471.00, 69.00, 5.20, 20.00, 3.00, 38.00, FALSE
    UNION ALL SELECT 'Maggi 2-Minute Masala Noodles', '8901058852493', 'g', 'PER_100G', 100.00, 427.00, 63.50, 8.00, 15.70, 3.60, 2.20, FALSE
) AS seed_data
WHERE NOT EXISTS (
    SELECT 1 FROM food_catalog fc WHERE fc.name = seed_data.name AND fc.is_custom = FALSE
);
