# Nutrition & Diet Tracker

A production-ready, full-stack nutrition and dietary management system built with **React 18**, **Node.js**, **Express**, and **MySQL**. The application enables users to track daily meals, monitor macronutrient and calorie targets, analyze nutritional trends through interactive charts, and scan packaged food barcodes using browser-based camera detection integrated with the Open Food Facts API.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Key Features](#4-key-features)
5. [Detailed Feature Explanations](#5-detailed-feature-explanations)
6. [Technology Stack](#6-technology-stack)
7. [System Architecture](#7-system-architecture)
8. [Application Workflow](#8-application-workflow)
9. [Folder Structure](#9-folder-structure)
10. [Database Design & Business Rules](#10-database-design--business-rules)
11. [Database Schema & Relationships](#11-database-schema--relationships)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Backend Architecture](#13-backend-architecture)
14. [Authentication & Security](#14-authentication--security)
15. [API Documentation](#15-api-documentation)
16. [External API Integration](#16-external-api-integration)
17. [Barcode Scanning Workflow](#17-barcode-scanning-workflow)
18. [Installation Requirements](#18-installation-requirements)
19. [Step-by-Step Local Setup](#19-step-by-step-local-setup)
20. [Environment Variables](#20-environment-variables)
21. [Database Configuration](#21-database-configuration)
22. [Running Frontend and Backend](#22-running-frontend-and-backend)
23. [Testing Instructions](#23-testing-instructions)
24. [UI Walkthrough & Interface Structure](#24-ui-walkthrough--interface-structure)
25. [Deployment Architecture & Status](#25-deployment-architecture--status)
26. [Known Limitations](#26-known-limitations)
27. [Future Enhancements](#27-future-enhancements)
28. [Repository Information](#28-repository-information)
29. [Troubleshooting & FAQ](#29-troubleshooting--faq)
30. [License](#30-license)

---

## 1. Project Overview

The **Nutrition & Diet Tracker** is designed for individuals seeking reliable dietary tracking with accurate nutritional computation and minimal data-entry friction. The platform combines a responsive Single Page Application (SPA) with a resilient REST API, backed by an ACID-compliant relational schema in MySQL.

### Core Capabilities
- **Fast Food Logging**: Log meals from a global food catalog, user-created custom entries, or raw manual inputs.
- **Automated Barcode Lookup**: Live camera barcode reading (EAN-13, EAN-8, UPC-A, UPC-E) coupled with automated Open Food Facts data extraction.
- **Macronutrient Tracking**: Real-time breakdown of Calories, Carbohydrates, Protein, Fat, Fiber, and Sugar.
- **Historical Analytics**: Interactive Chart.js visualizations for daily macro distribution and 7-day caloric adherence.
- **Data Integrity**: Row-level transaction locking to enforce concurrency constraints and daily log limits.

---

## 2. Problem Statement

Modern nutritional tracking applications often suffer from significant usability and architectural flaws:
- **Cumbersome Manual Logging**: Requiring users to enter every gram and nutrient manually leads to app abandonment.
- **Fragile Barcode Scanners**: Many tools rely exclusively on third-party commercial APIs with rate limits or fragile client-side queries that fail under restricted network environments.
- **Zero vs. Missing Data Confusion**: Unreported nutrients (such as sugar or fiber) are frequently stored as `0g`, distorting diet quality assessments.
- **Concurrency & Timezone Inaccuracies**: Logging meals near midnight across shifting daylight-saving boundaries often leads to misattributed daily totals or duplicate database records.

---

## 3. Objectives

- Deliver a zero-cost, self-hostable full-stack application with clean separation of concerns.
- Provide sub-second barcode resolution using server-side Open Food Facts proxying with IPv4 fallback.
- Ensure strict multi-tenant isolation where users can access only their own food logs, custom items, and goals.
- Guarantee strict validation and arithmetic precision using two-decimal fixed rounding on all nutritional computations.
- Support responsive cross-device operations across desktops, tablets, and mobile browsers.

---

## 4. Key Features

- **JWT Authentication**: Secure stateless token authentication with bcrypt password hashing (compatible with standard `$2b$` and legacy `$2a$` hashes).
- **Interactive Dashboard**: Real-time progress bars and donut charts comparing consumed macros against customized daily targets.
- **Multi-Format Barcode Engine**: Client-side video stream decoding via `@zxing/browser` paired with backend lookup across local catalog and global Open Food Facts databases.
- **Dual Nutrition Basis Scaling**: Seamless nutritional math supporting both `PER_100G` (scaled by grams/milliliters) and `PER_SERVING` (scaled by unit counts).
- **Daily Food Diary**: Filterable meal logs organized with inline editing and modal quantity adjustments.
- **7-Day Trend Visualizations**: Multi-bar charts illustrating caloric variance across rolling seven-day intervals.
- **Health & Connectivity Telemetry**: Persistent backend and database health polling surfaced via an unobtrusive status pill.

---

## 5. Detailed Feature Explanations

### 5.1 Barcode Scanning & Product Extraction
The scanner leverages the user's camera to read EAN-13, EAN-8, UPC-A, and UPC-E codes directly in browser memory. Once decoded, the identifier is sent to `GET /api/barcode/:barcode`. The backend checks local catalog items before dispatching an optimized request to Open Food Facts using field-limiting parameters (`fields=product_name,brands,nutriments,serving_size,...`) and IPv4 transport to bypass IPv6 NAT64 connection delays.

### 5.2 Dynamic Nutritional Scaling
When logging catalog foods, the backend calculates nutritional contributions dynamically:
- For `PER_100G`: `nutrient = (catalogValue * consumedQuantity) / 100`
- For `PER_SERVING`: `nutrient = (catalogValue * consumedQuantity) / servingSize`
All values are rounded using banker-safe arithmetic (`round2`) to prevent floating-point drift.

### 5.3 Daily Meal Constraint Engine
To prevent duplicate submissions from rapid double-clicks, the backend enforces:
1. A unique database constraint on `(user_id, logged_at)` to the nearest second.
2. An application rule allowing a maximum of 3 logs per catalog food item per local calendar day.
3. Row-level mutex locking (`SELECT id FROM users WHERE id = ? FOR UPDATE`) during log writes to prevent race conditions.

---

## 6. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Runtime** | React | 18.3.1 | Component-driven declarative UI |
| **Build Tooling** | Vite | 6.1.0 | Fast HMR dev server and Rollup production bundler |
| **Routing** | React Router DOM | 6.28.2 | Client-side routing and protected routes |
| **Icons** | Lucide React | 0.474.0 | Lightweight SVG interface icons |
| **Visualizations** | Chart.js / React-Chartjs-2 | 4.4.7 / 5.3.0 | Canvas-based donuts and bar charts |
| **Barcode Engine** | @zxing/browser | 0.1.5 | In-browser video stream barcode decoding |
| **HTTP Client** | Axios | 1.7.9 | Interceptor-enabled REST client |
| **Backend Runtime** | Node.js | >=20.0.0 | Asynchronous event-driven backend |
| **Web Framework** | Express.js | 4.21.2 | REST routing and middleware pipeline |
| **Database Driver** | mysql2/promise | 3.12.0 | Async connection pool for MySQL and TiDB |
| **Security & Auth** | bcrypt / jsonwebtoken | 5.1.1 / 9.0.2 | Salted password hashing & signed JWT tokens |
| **Validation** | express-validator | 7.2.1 | Strict schema validation on inputs |
| **Database** | MySQL / TiDB | 8.0+ / Serverless | Relational ACID storage engine |

---

## 7. System Architecture

```mermaid
flowchart TD
    User([User Browser])
    
    subgraph Frontend ["Frontend (React 18 + Vite)"]
        UI[UI Views & Pages]
        Scanner[ZXing Camera Scanner]
        AxiosClient[Axios API Client]
        AuthCtx[Auth & Toast State]
    end

    subgraph Backend ["Backend (Node.js + Express)"]
        Router[Express Router]
        AuthMW[JWT Auth Middleware]
        ValMW[Express Validator]
        
        subgraph Controllers ["Controllers & Services"]
            AuthController[Auth Controller]
            FoodLogController[Food Log Service]
            BarcodeController[Barcode Service]
            DashboardController[Dashboard Service]
        end
    end

    subgraph ExternalServices ["External Systems"]
        OFF[Open Food Facts API v2/v0]
        MySQL[(MySQL 8.0 / TiDB Serverless)]
    end

    User -->|Interacts| UI
    UI -->|Camera Frames| Scanner
    Scanner -->|Decoded Code| AxiosClient
    UI -->|CRUD Requests| AxiosClient
    AxiosClient -->|Bearer Token + HTTPS| Router

    Router --> ValMW --> AuthMW
    AuthMW --> AuthController
    AuthMW --> FoodLogController
    AuthMW --> BarcodeController
    AuthMW --> DashboardController

    BarcodeController -->|IPv4 Filtered Fetch| OFF
    AuthController -->|Connection Pool| MySQL
    FoodLogController -->|Transactions + FOR UPDATE| MySQL
    DashboardController -->|Aggregations| MySQL
```

---

## 8. Application Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant View as React UI
    participant Scanner as ZXing Engine
    participant API as Express API
    participant OFF as Open Food Facts
    participant DB as MySQL Database

    User->>View: Open Barcode Scanner
    View->>Scanner: Initialize Camera Stream
    Scanner->>View: Decode Barcode (e.g., 8901725007102)
    View->>API: GET /api/barcode/8901725007102
    
    API->>DB: SELECT * FROM food_catalog WHERE barcode = ?
    alt Found in Local Database
        DB-->>API: Return local food record
    else Not Found locally
        API->>OFF: Fetch /api/v2/product/{barcode} (IPv4, filtered fields)
        OFF-->>API: Return product details & nutriments
        API->>API: Normalize per-100g and per-serving values
    end
    API-->>View: Return normalized product snapshot
    
    User->>View: Confirm Quantity & Log Food
    View->>API: POST /api/food-logs
    API->>DB: BEGIN TRANSACTION & SELECT FOR UPDATE
    API->>DB: Check daily limit (max 3/day) & timestamp uniqueness
    API->>DB: INSERT INTO food_logs (...)
    API->>DB: COMMIT
    API-->>View: 201 Created
    View->>View: Update Dashboard & Progress Charts
```

---

## 9. Folder Structure

```text
nutrition-diet-tracker/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment variables and database pool
│   │   │   ├── db.js           # MySQL2 pool and automatic schema bootstrap
│   │   │   └── env.js          # Environment configuration parser
│   │   ├── controllers/        # Request orchestration layer
│   │   │   ├── authController.js
│   │   │   ├── barcodeController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── foodController.js
│   │   │   ├── foodLogController.js
│   │   │   ├── goalController.js
│   │   │   └── healthController.js
│   │   ├── middleware/         # Auth, validation, and error interceptors
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validateRequest.js
│   │   ├── models/             # Direct parameterized SQL execution
│   │   │   ├── foodLogModel.js
│   │   │   ├── foodModel.js
│   │   │   ├── goalModel.js
│   │   │   └── userModel.js
│   │   ├── routes/             # REST endpoint definitions
│   │   ├── services/           # Business logic & math computation
│   │   │   ├── authService.js
│   │   │   ├── barcodeService.js
│   │   │   ├── foodLogService.js
│   │   │   ├── foodService.js
│   │   │   ├── goalService.js
│   │   │   └── summaryService.js
│   │   ├── utils/              # Pure utility functions
│   │   │   ├── asyncHandler.js
│   │   │   ├── dateUtils.js
│   │   │   ├── errors.js
│   │   │   └── nutritionCalculator.js
│   │   └── validators/         # express-validator rule chains
│   ├── tests/                  # Node.js built-in runner unit tests
│   │   ├── authAndBarcodeLogic.test.js
│   │   ├── dateUtils.test.js
│   │   ├── nutritionCalculator.test.js
│   │   └── serviceIsolationAndRules.test.js
│   ├── package.json
│   └── server.js               # Application HTTP bootstrap
├── frontend/
│   ├── public/                 # Static assets and favicons
│   ├── src/
│   │   ├── assets/             # Global CSS variables and themes
│   │   │   └── theme.css       # Responsive styling system
│   │   ├── components/         # Reusable UI building blocks
│   │   │   ├── BarcodeScannerPanel.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── EditFoodLogModal.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ServerHealthBadge.jsx
│   │   ├── context/            # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/              # Custom hooks (e.g., useBarcodeScanner)
│   │   ├── layouts/            # Dashboard sidebar and header layout
│   │   ├── pages/              # 11 distinct application views
│   │   │   ├── AddFoodPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FoodDatabasePage.jsx
│   │   │   ├── FoodDiaryPage.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NutritionSummaryPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ScanBarcodePage.jsx
│   │   ├── services/           # Axios client and endpoint wrappers
│   │   │   └── api.js
│   │   ├── utils/              # Frontend formatting helpers
│   │   ├── App.jsx             # Router and view definitions
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql              # Idempotent DDL and reference seed data
│   └── scripts/
│       └── migrate_tidb.js     # TiDB Serverless migration helper
├── render.yaml                 # Infrastructure-as-code deployment manifest
└── README.md
```

---

## 10. Database Design & Business Rules

1. **Isolation by User**: Every database query on `user_goals`, `food_logs`, and custom `food_catalog` items includes `WHERE user_id = ?` to prevent cross-account data leaks.
2. **Deterministic Nutritional Math**: Logged entries copy nutritional snapshots directly into `food_logs` at insertion time. If a catalog item is later modified, previous meal records retain their historical values.
3. **Idempotent Seeding**: Standard reference foods (such as oats, chicken breast, and eggs) are inserted on initial startup only if they do not already exist.
4. **Concurrency Guardrails**: Mutex locks are obtained via `SELECT id FROM users WHERE id = ? FOR UPDATE` within an active transaction before writing logs.
5. **Exact Second Resolution**: Milliseconds are truncated upon storage to ensure consistent comparisons across MySQL `TIMESTAMP` columns.

---

## 11. Database Schema & Relationships

```mermaid
erDiagram
    users ||--o| user_goals : "defines"
    users ||--o{ food_catalog : "creates (custom)"
    users ||--o{ food_logs : "records"
    food_catalog ||--o{ food_logs : "referenced by"

    users {
        BIGINT id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR full_name
        VARCHAR timezone
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    user_goals {
        BIGINT id PK
        BIGINT user_id FK,UK
        DECIMAL daily_calories
        DECIMAL daily_carbs
        DECIMAL daily_protein
        DECIMAL daily_fat
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    food_catalog {
        BIGINT id PK
        VARCHAR name
        VARCHAR barcode
        VARCHAR serving_unit
        VARCHAR nutrition_basis
        DECIMAL serving_size
        DECIMAL calories
        DECIMAL carbohydrates
        DECIMAL protein
        DECIMAL fat
        DECIMAL fiber
        DECIMAL sugar
        BOOLEAN is_custom
        BIGINT created_by_user_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    food_logs {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT food_id FK
        VARCHAR food_name
        DECIMAL consumed_quantity
        VARCHAR serving_unit
        DECIMAL calories
        DECIMAL carbohydrates
        DECIMAL protein
        DECIMAL fat
        DECIMAL fiber
        DECIMAL sugar
        TIMESTAMP logged_at
        TIMESTAMP created_at
    }
```

---

## 12. Frontend Architecture

The frontend is structured around a centralized layout with state isolation:
- **Routing & Navigation**: Handled by `react-router-dom`. Unauthenticated users are routed to `/login` or `/register`. Authenticated users are directed to `/dashboard` inside `DashboardLayout`.
- **Global Auth State (`AuthContext`)**: Stores the current user profile, token persistence in `localStorage`, and provides login/logout callbacks.
- **Feedback Engine (`ToastContext`)**: Dispatches transient notifications across all pages for network errors, successful actions, and warnings.
- **Barcode Hook (`useBarcodeScanner`)**: Wraps `@zxing/browser` camera controls, providing start/stop lifecycle management, camera device enumeration, and frame throttling.
- **Styling (`theme.css`)**: Implements an accessible green-and-white theme using CSS custom properties with responsive sidebar transitions.

---

## 13. Backend Architecture

The backend follows an Express MVC pattern:
- **Routing Layer (`src/routes/`)**: Mounts endpoints and binds route-specific validators.
- **Validation Layer (`src/validators/`)**: Uses `express-validator` to sanitize strings, enforce numeric ranges, and ensure correct ISO-8601 timestamps.
- **Controller Layer (`src/controllers/`)**: Manages HTTP status codes, extracts authenticated request contexts (`req.user`), and forwards payloads to services.
- **Service Layer (`src/services/`)**: Implements business rules, external API integration, transaction orchestration, and nutritional calculations.
- **Model Layer (`src/models/`)**: Executes raw parameterized SQL queries via `mysql2/promise` connection pools.

---

## 14. Authentication & Security

- **Password Hashing**: Utilizes `bcrypt` with work factor 10. The verification logic checks standard `$2b$` hashes while preserving backward compatibility with legacy `$2a$` hashes.
- **Signed Tokens**: Issues JSON Web Tokens (JWT) signed with a server secret with a default 24-hour expiration (`24h`).
- **SQL Injection Defense**: All database operations use strictly parameterized statements (`?` placeholders). No dynamic string concatenation is permitted in SQL queries.
- **CORS Protection**: Access is restricted to configured origins (`FRONTEND_ORIGIN`), local development hosts, and production subdomains.
- **Credential Hygiene**: Sensitive configurations and database credentials are fully decoupled from source code using environment variables.

---

## 15. API Documentation

### 15.1 Health & Diagnostics
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Service telemetry and database readiness | `200`, `503` |

### 15.2 Authentication
| Method | Endpoint | Auth | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | `{ email, password, fullName }` | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | None | `{ email, password }` | `200`, `400`, `401` |
| `POST` | `/api/auth/logout` | Bearer | Empty | `200` |
| `GET` | `/api/auth/me` | Bearer | None | `200`, `401` |
| `PUT` | `/api/auth/profile` | Bearer | `{ fullName }` | `200`, `400`, `401` |

### 15.3 Food Catalog
| Method | Endpoint | Auth | Query / Body Params | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/foods` | Bearer | `?search=&limit=50&offset=0` | `200`, `401` |
| `GET` | `/api/foods/search` | Bearer | `?q=chicken` | `200`, `401` |
| `GET` | `/api/foods/:id` | Bearer | Path `id` | `200`, `404` |
| `POST` | `/api/foods` | Bearer | `{ name, barcode, calories, carbohydrates, protein, fat, fiber, sugar, servingSize, servingUnit, nutritionBasis }` | `201`, `400` |

### 15.4 Food Logging
| Method | Endpoint | Auth | Request Body / Query | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/food-logs` | Bearer | `{ foodId, foodName, consumedQuantity, servingUnit, loggedAt, ... }` | `201`, `400`, `409` |
| `POST` | `/api/food-logs/preview` | Bearer | `{ foodId, consumedQuantity }` | `200`, `400` |
| `GET` | `/api/food-logs/today` | Bearer | None | `200`, `401` |
| `GET` | `/api/food-logs/history` | Bearer | `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | `200`, `400` |
| `PUT` | `/api/food-logs/:id` | Bearer | `{ consumedQuantity, loggedAt }` | `200`, `400`, `404` |
| `DELETE` | `/api/food-logs/:id` | Bearer | Path `id` | `200`, `404` |

### 15.5 Nutrition Goals & Analytics
| Method | Endpoint | Auth | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/goals` | Bearer | None | `200`, `401` |
| `PUT` | `/api/goals` | Bearer | `{ dailyCalories, dailyCarbs, dailyProtein, dailyFat }` | `200`, `400` |
| `GET` | `/api/dashboard/summary`| Bearer | None | `200`, `401` |
| `GET` | `/api/summary/daily` | Bearer | `?date=YYYY-MM-DD` | `200`, `400` |
| `GET` | `/api/summary/weekly` | Bearer | `?startDate=YYYY-MM-DD` | `200`, `400` |

### 15.6 Barcode Lookup
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/barcode/:barcode` | Bearer | Looks up item in local DB, then queries Open Food Facts | `200`, `404`, `502` |

---

## 16. External API Integration

The application connects to **Open Food Facts** to resolve commercial packaged food barcodes without requiring client-side API keys.

### Resilience Implementations
- **Selective Field Querying**: Requests include `?fields=product_name,brands,nutriments,serving_size,quantity,image_front_small_url` to reduce network payload sizes by ~85%.
- **Forced IPv4 Addressing**: Node's HTTPS request sets `family: 4` to prevent stalling on NAT64 networks where IPv6 resolution can hang.
- **Regional Mirror Fallback**: Indian barcodes (starting with `890`) query `https://in.openfoodfacts.org` before falling back to `https://world.openfoodfacts.org`.
- **Nutrient Extraction Logic**: Distinguishes between explicitly reported zero values and unrecorded nutrients (which are returned as `null` rather than `0g`).

---

## 17. Barcode Scanning Workflow

1. **Permission Request**: The client requests browser webcam access using `navigator.mediaDevices.getUserMedia`.
2. **Real-Time Video Rendering**: The video stream is mirrored into a video canvas element with a visual bounding box overlay.
3. **ZXing Engine Processing**: `@zxing/browser` decodes frames at 200ms intervals looking for supported symbologies (`EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`).
4. **Debounced Query Execution**: When a code is detected, scanning pauses to avoid duplicate queries, and the backend lookup is triggered.
5. **Fallback Flow**: If the product is not found in Open Food Facts or camera access is denied, users are seamlessly redirected to manual entry with the detected barcode pre-filled.

---

## 18. Installation Requirements

- **Node.js**: Version `20.0.0` or higher (`node -v`)
- **Package Manager**: `npm` (comes with Node.js)
- **Database**: MySQL Server `8.0+` or TiDB Cloud Serverless instance
- **Web Browser**: Chrome, Firefox, Edge, or Safari with WebRTC / MediaDevices camera support

---

## 19. Step-by-Step Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/maheshgollavalli14/nutrition-diet-tracker.git
cd nutrition-diet-tracker
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Backend Environment Variables
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# Local MySQL credentials
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nutrition_tracker
DB_SSL=false

# Authentication
JWT_SECRET=super_secret_development_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# External API
OPEN_FOOD_FACTS_BASE_URL=https://world.openfoodfacts.org/api/v2/product/
```

### Step 4: Initialize the Database
The backend automatically creates tables on startup. Alternatively, you can run the script manually:
```bash
mysql -u root -p -P 3307 -h 127.0.0.1 < ../database/schema.sql
```

### Step 5: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 6: Configure Frontend Environment Variables
Create a `.env` file inside the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 20. Environment Variables

| Variable | Scope | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Backend | No | `5000` | Port for Express HTTP server |
| `NODE_ENV` | Backend | No | `development` | Environment mode (`development`/`production`) |
| `FRONTEND_ORIGIN` | Backend | Yes | `http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `DB_HOST` | Backend | Yes | `127.0.0.1` | MySQL hostname or cluster endpoint |
| `DB_PORT` | Backend | No | `3306` | MySQL port (e.g., 3307 for custom local setups, 4000 for TiDB) |
| `DB_USER` | Backend | Yes | `root` | Database username |
| `DB_PASSWORD` | Backend | Yes | `""` | Database password |
| `DB_NAME` | Backend | Yes | `nutrition_tracker` | Database schema name |
| `DB_SSL` | Backend | No | `false` | Enable TLS/SSL connection (`true` for TiDB) |
| `DATABASE_URL` | Backend | Optional | None | Standard connection URL (`mysql://user:pass@host:port/db`) |
| `JWT_SECRET` | Backend | Yes | None | Secret key used for signing JWT tokens |
| `JWT_EXPIRES_IN` | Backend | No | `24h` | JWT validity duration |
| `VITE_API_URL` | Frontend | Yes | `http://localhost:5000/api`| Base URL for the Express API |

---

## 21. Database Configuration

### Option A: Local MySQL 8.0 Server
1. Start your local MySQL service on port `3306` or `3307`.
2. Ensure the `nutrition_tracker` database exists or grant permission for the application to create it.
3. Configure `DB_PORT` and `DB_PASSWORD` in `backend/.env`.

### Option B: TiDB Cloud Serverless (Zero-Cost Production DB)
1. Create a free cluster at [TiDB Cloud](https://tidbcloud.com/).
2. Obtain the standard MySQL connection URL.
3. Execute the provided migration utility to initialize tables:
   ```bash
   node database/scripts/migrate_tidb.js "mysql://<USER>:<PASS>@<HOST>:4000/nutrition_tracker?ssl=true"
   ```
4. Set `DB_SSL=true` and `DB_PORT=4000` in the backend environment.

---

## 22. Running Frontend and Backend

### Development Mode

#### Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Starts server with nodemon reload at http://localhost:5000
```

#### Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Starts Vite dev server at http://localhost:5173
```

### Production Build

#### Backend:
```bash
cd backend
npm start
```

#### Frontend:
```bash
cd frontend
npm run build
npm run preview
```

---

## 23. Testing Instructions

The repository includes comprehensive automated test suites using Node.js's native test runner (`node --test`), verifying 18 critical scenarios:

```bash
cd backend
npm test
```

### Verified Test Suites
1. **Password Verification**: Validates both newly created bcrypt hashes and legacy `$2a$` hashes.
2. **Open Food Facts Normalization**: Tests energy unit conversions (kJ to kcal), serving fallbacks, and nutrient boundaries.
3. **Route Security**: Verifies that unauthenticated requests to protected endpoints return `401 Unauthorized` and ensures `/api/health` never exposes credentials.
4. **Barcode Resolution**: Confirms successful multi-format lookups against sample barcodes (`8901725007102`, `3017620422003`).
5. **Timezone Calculations**: Tests boundary calculations across UTC, offset zones (`Asia/Kolkata`), and daylight saving transitions (`America/New_York`).
6. **Nutritional Scaling**: Confirms arithmetic precision for both `PER_100G` and `PER_SERVING` bases.
7. **Multi-Tenant Isolation**: Proves that users cannot view, edit, or delete meals or custom foods belonging to other users.
8. **Daily Log Constraints**: Verifies that the maximum limit of 3 entries per food per calendar day is enforced.

To verify the frontend build:
```bash
cd frontend
npm run build
```

---

## 24. UI Walkthrough & Interface Structure

| Page | Route | Description |
| :--- | :--- | :--- |
| **Login** | `/login` | Email and password authentication with validation |
| **Register** | `/register` | User onboarding with automatic daily goal creation |
| **Dashboard** | `/dashboard` | Today's nutritional summary, goal progress bars, and macro donut chart |
| **Add Food** | `/add-food` | Custom meal creator and catalog search with dynamic unit scaling |
| **Scan Barcode** | `/scan` | Camera scanner with live detection and instant food logging modal |
| **Food Diary** | `/diary` | Today's logged meals with inline editing and delete operations |
| **Nutrition Summary** | `/summary` | Granular breakdown of macro and micronutrient distributions |
| **History** | `/history` | Date-filtered historical logs with 7-day caloric bar chart |
| **Goals** | `/goals` | Customizable calorie, carbohydrate, protein, and fat daily targets |
| **Food Database** | `/database` | Browsable food catalog showing reference and custom items |
| **Profile** | `/profile` | Account settings, display name management, and security controls |

---

## 25. Deployment Architecture & Status

The project includes a unified zero-cost deployment configuration via `render.yaml`:

```mermaid
flowchart LR
    GitHub[GitHub Repo: main] --> RenderStatic[Render Static Site: Frontend]
    GitHub --> RenderWeb[Render Web Service: Backend]
    RenderWeb <--> TiDB[(TiDB Cloud: Free Serverless MySQL)]
    RenderStatic <--> RenderWeb
```

### Hosting Breakdown ($0.00 / Month)
- **Frontend**: Render Static Site (free global CDN hosting with automatic SPA routing rewrites to `/index.html`).
- **Backend**: Render Web Service (free Node.js runtime with automatic health checks at `/api/health`).
- **Database**: TiDB Cloud Serverless (5GB free storage, MySQL 8.0 wire protocol compatibility, TLS-enabled).

> [!NOTE]
> The codebase and `render.yaml` manifest are fully prepared and pushed to `main`. Live cloud activation requires connecting the repository in Render and entering the TiDB Cloud database connection string.

---

## 26. Known Limitations

- **Camera Permissions**: Barcode scanning requires an active camera device and browser HTTPS or localhost permissions.
- **Render Free Tier Sleep**: Free Web Services on Render spin down after 15 minutes of inactivity. The initial request after idle may take 30–50 seconds to wake up.
- **Open Food Facts Coverage**: Packaged foods not cataloged in the open-source Open Food Facts database will trigger the manual entry fallback form.

---

## 27. Future Enhancements

- [ ] Multi-meal categorization (Breakfast, Lunch, Dinner, Snacks).
- [ ] Offline meal caching with background synchronization via Service Workers.
- [ ] Optical Character Recognition (OCR) for nutrition fact labels using Tesseract.js.
- [ ] Exporting diary logs to PDF and CSV formats.
- [ ] Micronutrient tracking (Vitamin D, Iron, Calcium, Potassium).

---

## 28. Repository Information

- **Repository**: [https://github.com/maheshgollavalli14/nutrition-diet-tracker](https://github.com/maheshgollavalli14/nutrition-diet-tracker)
- **Default Branch**: `main`
- **Maintainer**: Mahesh Gollavalli

---

## 29. Troubleshooting & FAQ

### Q1: Why does the camera not open on the Scan Barcode page?
**A**: Web browsers only grant camera access over secure origins (`https://` or `http://localhost`). Ensure your browser has granted camera permission to the site.

### Q2: Why is the backend unable to connect to MySQL on startup?
**A**: Verify that MySQL is running (`mysqladmin ping`), that credentials in `backend/.env` are accurate, and that the specified `DB_PORT` matches your instance (e.g., `3306` or `3307`).

### Q3: How do I reset or reseed the food catalog?
**A**: The database schema uses idempotent inserts (`WHERE NOT EXISTS`). You can re-run `database/schema.sql` at any time without erasing user accounts or existing meal logs.

---

## 30. License

This project is licensed under the open-source [MIT License](https://opensource.org/licenses/MIT).
