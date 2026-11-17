# Nutrition & Diet Tracker

A full-stack **Nutrition & Diet Tracker** application built with **React + Vite**, **Node.js + Express.js**, and **MySQL (`mysql2/promise`)**, featuring JWT authentication, strict per-user data isolation, Chart.js analytics, camera & manual barcode scanning via `@zxing/browser` and Open Food Facts, and timezone-aware daily tracking.

---

## Project Structure

```text
FSD/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/        # Accessible green-and-white CSS theme
│       ├── components/    # Charts, barcode scanner panel, edit modal, health badge
│       ├── pages/         # Login, Register, Dashboard, Add Food, Diary, Summary, History, Goals, Database, Profile
│       ├── layouts/       # Responsive forest-green sidebar dashboard layout
│       ├── services/      # Axios client with JWT interceptor and typed API helpers
│       ├── hooks/         # Webcam barcode scanner hook (@zxing/browser)
│       ├── context/       # AuthContext & ToastContext
│       ├── utils/         # Nutrition preview calculation & timezone date helpers
│       ├── App.jsx
│       └── main.jsx
├── backend/
│   ├── src/
│   │   ├── config/        # Environment loader & mysql2/promise connection pool
│   │   ├── controllers/   # REST route handlers
│   │   ├── routes/        # Express API route registration
│   │   ├── middleware/    # JWT verification, express-validator check, error handler
│   │   ├── services/      # Business logic (auth, logs, summary, goals, Open Food Facts)
│   │   ├── models/        # Parameterized MySQL SQL data access layer
│   │   ├── validators/    # express-validator request rules
│   │   ├── utils/         # Nutrition math, IANA timezone boundaries, error classes
│   │   └── app.js
│   ├── tests/             # Node built-in test runner suite (`node --test`)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── database/
│   ├── schema.sql         # Non-destructive DDL + idempotent food catalog seed
│   ├── migrations/        # Ordered SQL migration scripts
│   └── README.md
└── .gitignore
```

---

## Database Diagnosis (`ERROR 1045 / SQLSTATE 28000`)

Inspection of the local Windows environment identified why `Access denied for user 'root'@'localhost'` occurs:

1. **Two separate MySQL Windows services run simultaneously** on this machine:
   - `MySQL91` listening on port **3306** (`C:\ProgramData\MySQL\MySQL Server 9.1\my.ini`)
   - `MySQL80` (MySQL 8.0.46) listening on port **3307** (`C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`, `authentication_policy=mysql_native_password,,`)
2. **MySQL Workbench** has a connection named `"Local instance MySQL91"` configured to connect to `127.0.0.1:3307` (`MySQL80`), while the Windows environment variable `DB_PASSWORD` was not defined.
3. Supplying an empty password or the password from the `MySQL91` instance (`3306`) to the `MySQL80` instance (`3307`) produces `ERROR 1045 (28000): Access denied for user 'root'@'localhost'`.

**Fix:** Never hardcode credentials in source code. Put your actual MySQL 8.0 (`port 3307`) `root` password in `backend/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_actual_mysql_3307_root_password
DB_NAME=nutrition_tracker
JWT_SECRET=your_long_random_secret_key
PORT=5000
```

Verify database connectivity anytime via:
```text
GET http://localhost:5000/api/health
```

---

## Setup & Startup Commands (Windows PowerShell)

### 1. Prepare Database Schema (Non-Destructive)
If `nutrition_tracker` tables are not yet initialized on MySQL `127.0.0.1:3307` (safe on existing databases; uses `CREATE DATABASE/TABLE IF NOT EXISTS` and never drops user data):
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3307 -u root -p < C:\FSD\database\schema.sql
```
*(Or open and execute `C:\FSD\database\schema.sql` in MySQL Workbench connected to port `3307`.)*

### 2. Install & Run Backend API (`http://localhost:5000`)
```powershell
cd C:\FSD\backend
npm install
# Ensure DB_PASSWORD is set in C:\FSD\backend\.env
npm test
npm start
```

### 3. Install & Run Frontend (`http://localhost:5173`)
```powershell
cd C:\FSD\frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser and register a new user account.

---

## Key Features Implemented

- **Real Authentication & Isolation:** `bcrypt` password hashing (compatible with existing `$2a$` and `$2b$` hashes), JWT bearer verification, automatic default goals creation on sign-up, and strict server-side `user_id` scoping on every query.
- **No Demo Accounts / Empty Initial State:** No hardcoded demo credentials or seeded sample food logs. New users start cleanly with empty states until they add entries.
- **Portion Math & Logging Rules:**
  - `PER_100G` (`consumed / 100`) and `PER_SERVING` (`consumed / servingSize`) scaling
  - Snapshot storage on `food_logs` so historical diaries remain immutable if catalog references change
  - Direct manual meal entries (`food_id = NULL`) and private custom catalog foods (`is_custom = 1`)
  - Up to **3 logs per catalog food per local calendar day** (using transaction `FOR UPDATE` locking and the user's IANA timezone)
  - Duplicate exact-second timestamp protection (`uk_user_logged_at`)
  - History inspection up to **365 days**
- **Barcode Scanning:** Webcam scanning (`@zxing/browser`) + manual UPC/EAN lookup querying local catalog first and Open Food Facts API v2 with editable nutrition drafts and manual fallback.
