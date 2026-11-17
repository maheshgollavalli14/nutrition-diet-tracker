# Database Setup & Migration Guide (`nutrition_tracker`)

## Overview
This schema preserves full compatibility with existing `nutrition_tracker` tables created previously (`users`, `user_goals`, `food_catalog`, `food_logs`) without dropping or resetting existing user records.

## Tables
- `users`: Stores registered user accounts, normalized unique `email`, bcrypt `password_hash`, `full_name`, and `timezone`.
- `user_goals`: Per-user daily targets (`daily_calories`, `daily_carbs`, `daily_protein`, `daily_fat`).
- `food_catalog`: Verified reference foods (`is_custom = FALSE`, `created_by_user_id IS NULL`) and user-specific custom foods (`created_by_user_id = users.id`).
- `food_logs`: User meal logs preserving immutable nutrient snapshots (`calories`, `carbohydrates`, `protein`, `fat`, `fiber`, `sugar`) and enforcing `(user_id, logged_at)` uniqueness via `uk_user_logged_at`.

## Importing in MySQL Workbench (Port 3307)
1. Open **MySQL Workbench**.
2. Connect to your MySQL 8.0 instance at **`127.0.0.1:3307`** (User: `root`).
   - *Note:* If multiple MySQL services are installed on Windows (e.g. `MySQL80` on port `3307` and `MySQL91` on port `3306`), ensure your connection points to `127.0.0.1` port `3307` and uses the password configured for that specific MySQL instance.
3. Click **File -> Open SQL Script...** and select `C:\FSD\database\schema.sql`.
4. Click the lightning bolt (**Execute**) icon. Because every statement is idempotent (`CREATE TABLE IF NOT EXISTS`, conditional `INSERT`), existing tables and user rows are preserved.

## Importing via Command Line (PowerShell)
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3307 -u root -p < C:\FSD\database\schema.sql
```
