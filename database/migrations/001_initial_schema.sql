-- Migration 001: Ensure core Nutrition & Diet Tracker tables exist non-destructively

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    daily_calories DECIMAL(10,2) NOT NULL DEFAULT 2000.00,
    daily_carbs DECIMAL(10,2) NOT NULL DEFAULT 250.00,
    daily_protein DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    daily_fat DECIMAL(10,2) NOT NULL DEFAULT 65.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    INDEX idx_food_catalog_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
