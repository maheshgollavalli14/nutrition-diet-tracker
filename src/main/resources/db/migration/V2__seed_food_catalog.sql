-- V2__seed_food_catalog.sql: Initial catalog foods

INSERT INTO food_catalog (name, barcode, serving_unit, nutrition_basis, serving_size, calories, carbohydrates, protein, fat, fiber, sugar, is_custom)
VALUES
('Chicken Breast (Raw)', NULL, 'g', 'PER_100G', 100.00, 165.00, 0.00, 31.00, 3.60, 0.00, 0.00, FALSE),
('Brown Rice (Cooked)', NULL, 'g', 'PER_100G', 100.00, 112.00, 24.00, 2.60, 0.90, 1.80, 0.40, FALSE),
('Rolled Oats', NULL, 'g', 'PER_100G', 100.00, 389.00, 66.00, 17.00, 7.00, 10.60, 1.00, FALSE),
('Greek Yogurt (Plain Non-fat)', NULL, 'g', 'PER_100G', 100.00, 59.00, 3.60, 10.00, 0.40, 0.00, 3.20, FALSE),
('Whole Egg (Large)', NULL, 'egg', 'PER_SERVING', 1.00, 72.00, 0.40, 6.30, 4.80, 0.00, 0.20, FALSE),
('Banana (Fresh)', NULL, 'g', 'PER_100G', 100.00, 89.00, 23.00, 1.10, 0.30, 2.60, 12.20, FALSE),
('Atlantic Salmon Fillet', NULL, 'g', 'PER_100G', 100.00, 208.00, 0.00, 20.00, 13.00, 0.00, 0.00, FALSE),
('Broccoli (Fresh)', NULL, 'g', 'PER_100G', 100.00, 34.00, 7.00, 2.80, 0.40, 2.60, 1.70, FALSE),
('Almonds (Raw)', NULL, 'g', 'PER_100G', 100.00, 579.00, 22.00, 21.00, 50.00, 12.50, 4.40, FALSE),
('Whole Wheat Bread Slice', NULL, 'slice', 'PER_SERVING', 1.00, 69.00, 12.00, 4.00, 1.00, 2.00, 1.50, FALSE),
('Sweet Potato (Baked)', NULL, 'g', 'PER_100G', 100.00, 90.00, 21.00, 2.00, 0.20, 3.30, 6.50, FALSE),
('Black Beans (Cooked)', NULL, 'g', 'PER_100G', 100.00, 132.00, 24.00, 8.90, 0.50, 8.70, 0.30, FALSE),
('Avocado (Fresh)', NULL, 'g', 'PER_100G', 100.00, 160.00, 8.50, 2.00, 15.00, 6.70, 0.70, FALSE),
('Olive Oil (Extra Virgin)', NULL, 'ml', 'PER_100G', 100.00, 884.00, 0.00, 0.00, 100.00, 0.00, 0.00, FALSE),
('Whole Milk', NULL, 'ml', 'PER_100G', 100.00, 61.00, 4.80, 3.20, 3.30, 0.00, 5.10, FALSE),
('Peanut Butter (Smooth)', NULL, 'g', 'PER_100G', 100.00, 588.00, 20.00, 25.00, 50.00, 6.00, 9.00, FALSE),
('Tofu (Firm)', NULL, 'g', 'PER_100G', 100.00, 76.00, 1.90, 8.00, 4.80, 0.30, 0.60, FALSE),
('Apple (Fresh Red)', NULL, 'g', 'PER_100G', 100.00, 52.00, 14.00, 0.30, 0.20, 2.40, 10.40, FALSE),
('Spinach (Fresh)', NULL, 'g', 'PER_100G', 100.00, 23.00, 3.60, 2.90, 0.40, 2.20, 0.40, FALSE),
('Quinoa (Cooked)', NULL, 'g', 'PER_100G', 100.00, 120.00, 21.00, 4.40, 1.90, 2.80, 0.90, FALSE),
('Nutella Hazelnut Spread', '3017620422003', 'g', 'PER_100G', 100.00, 539.00, 57.50, 6.30, 30.90, 3.00, 56.30, FALSE),
('Coca-Cola Original Taste', '5449000000996', 'ml', 'PER_100G', 100.00, 42.00, 10.60, 0.00, 0.00, 0.00, 10.60, FALSE),
('Oreo Original Sandwich Cookies', '7622210449283', 'g', 'PER_100G', 100.00, 471.00, 69.00, 5.20, 20.00, 3.00, 38.00, FALSE),
('Maggi 2-Minute Masala Noodles', '8901058852493', 'g', 'PER_100G', 100.00, 427.00, 63.50, 8.00, 15.70, 3.60, 2.20, FALSE);
