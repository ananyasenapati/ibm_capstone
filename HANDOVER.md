# 📘 eBookStore — Complete Implementation Guide (Project Handover)

> **Confidential — for the project purchaser only.** This document describes every module, every REST API endpoint, the database schema, business rules, deployment architecture, and operational knowledge required to run, maintain, and extend the platform.

---

## 🚀 Deployment Map (live services)

| Service | Platform | URL / Location | Status |
|---|---|---|---|
| **Backend API** | Render (Docker) | `https://ibm-capstone.onrender.com` | ✅ Live |
| **Frontend SPA** | Vercel | `https://ibm-capstone.vercel.app` *(update with your actual URL)* | ⬜ Deploy separately |
| **Database** | Neon (PostgreSQL 15) | `ep-cool-king-a5z3tv34-pooler.us-east-2.aws.neon.tech` | ✅ Provisioned |
| **Photo Storage** | Neon Storage (S3-compatible) | `br-square-flower-a52a0ppq.storage.c-1.us-east-2.aws.neon.tech` | ✅ Configured |
| **Source Code** | GitHub | `https://github.com/ananyasenapati/ibm_capstone` | ✅ Latest commit `95dcf41` |

### How the pieces connect
```
User's browser
    │
    ▼
Vercel CDN (React SPA, frontend/)
    │  vercel.json rewrites:
    │    /api/*    → https://ibm-capstone.onrender.com/api/*
    │    /uploads/* → https://ibm-capstone.onrender.com/uploads/*
    │
    ▼
Render Docker Container (Spring Boot, backend/)
    │  Dockerfile builds → multi-stage Maven → JRE Alpine
    │  ENTRYPOINT: java -Dserver.port=${PORT:-8080} -jar app.jar
    │
    ├──► Neon PostgreSQL (via DB_URL JDBC)
    └──► Neon Storage S3 (via AWS_* env vars)
```

### Auto-deploy behavior
- **Render**: watches `main` branch → every `git push` triggers a fresh Docker build & deploy (~3–5 min)
- **Vercel**: watches `main` branch → every `git push` triggers `npm run build` & deploy (~1 min)
- **Both** deploy only when their **Root Directory** changes:
  - Render: only changes under `backend/`
  - Vercel: only changes under `frontend/`

---

## 1. System Overview

A multi-vendor e-commerce bookstore. Three roles with isolated capabilities:

| Role | Capabilities |
|---|---|
| **CUSTOMER** | Browse/search catalogue, rate products, manage cart, checkout with addresses, redeem gift points, track & cancel orders |
| **SELLER** | Register (requires admin approval), manage product catalogue with images, fulfil orders, view revenue & ratings |
| **ADMIN** | Approve/reject/remove sellers, manage users (block/activate), manage categories, view platform KPIs |

**Authentication:** stateless JWT. Login returns an access token (24 h) + refresh token (7 days). The React client auto-refreshes expired access tokens via an Axios interceptor.

**Payment:** intentionally a **mock gateway** — orders create a `payments` row with a generated `TXN...` transaction id and `COMPLETED` status (currency INR). Ready to be replaced with Razorpay/Stripe (see §10).

**Cart:** stored **in-memory** (`HashMap<userId, items>` in `OrderService`) — server restart clears carts. Swap-in of a persistent cart is listed in §10.

---

## 2. Tech Stack (exact versions)

| Component | Version | Where |
|---|---|---|
| Java | 17 | `backend/pom.xml` (`java.version`) |
| Spring Boot | 3.2.0 | parent POM |
| springdoc-openapi | 2.3.0 | Swagger UI at `/swagger-ui.html` |
| JJWT | 0.12.3 | token signing (HS256, Base64 secret) |
| AWS SDK v2 (s3) | 2.25.x | S3-compatible photo storage (Neon Storage / AWS / R2 / MinIO) |
| Liquibase | bundled | 15 changelogs in `src/main/resources/db/changelog/` |
| PostgreSQL | 14+ recommended | local or Neon cloud; schema auto-created by Liquibase |
| React / TypeScript / Vite | 18.3 / 5.3 / 5.0 | `frontend/package.json` |
| Zustand | 5.x | client auth state |
| React Query | 3.39 | server-state fetching |
| Tailwind CSS | 3.3 | styling |

---

## 3. Backend Module Map

```
com.capstone
├── EbookstoreApplication      # entry point
├── config/
│   ├── SecurityConfig         # filter chain, role rules, CORS, BCrypt bean
│   └── WebConfig              # CORS mappings + /uploads/** static serving
├── security/
│   ├── JwtUtil                # token generation/validation (access + refresh)
│   ├── JwtAuthFilter          # once-per-request Bearer token filter
│   └── CustomUserDetailsService
├── controller/                # 9 controllers — see §5
│   AuthController · ProductController · CategoryController · CartController
│   OrderController · AddressController · FileUploadController
│   SellerController · AdminController
├── service/                   # business logic layer (one per domain)
├── repository/                # Spring Data JPA interfaces
├── entity/                    # JPA entities — see §6
└── dto/                       # request/response records per module
```

**Security rules (`SecurityConfig`):**

| Path pattern | Access |
|---|---|
| `/api/auth/**`, `/api/categories/**`, `/api/products/**`, `/uploads/**`, `/swagger-ui/**`, `/v3/api-docs/**` | public |
| `/api/admin/**` | role `ADMIN` |
| `/api/seller/**` | role `SELLER` |
| everything else (cart, orders, addresses, upload) | authenticated (any role) |

CORS allows origin `http://localhost:5173` (change in `SecurityConfig` + `WebConfig` for production, see §9).

---

## 4. Frontend Module Map

```
frontend/src
├── App.tsx                  # router + role-guarded routes + toast config
├── layouts/Layout.tsx       # navbar/footer shell for all pages
├── pages/
│   ├── Login.tsx · Register.tsx        # auth (customer + seller signup tabs)
│   ├── Landing.tsx · Catalogue.tsx     # home, search/filter/paged grid
│   ├── ProductDetail.tsx               # info + ratings/reviews
│   ├── Cart.tsx · Checkout.tsx         # cart mgmt, address + gift-points + pay
│   ├── MyOrders.tsx · Profile.tsx      # order history/cancel, profile update
│   ├── admin/  AdminDashboard · AdminSellers · AdminUsers · AdminCategories
│   └── seller/ SellerDashboard · SellerProducts · SellerOrders · SellerRatings
├── services/api.ts          # Axios base client + 401 auto-refresh interceptor
├── store/authStore.ts       # Zustand: user, token persistence (localStorage)
├── components/              # Ui.tsx (shared), SellerApprovalBanner, StateViews
└── lib/format.ts            # currency/date formatters
```

**Routes:** `/login`, `/register`, `/`, `/catalogue`, `/products/:id`, `/cart`, `/checkout`, `/my-orders`, `/profile`, `/admin*` (ADMIN only), `/seller*` (SELLER only). Guards: `ProtectedRoute` checks `useAuthStore` user + optional role list.

---

## 5. REST API Reference (complete)

Base URL: `http://localhost:8080/api` — authenticated calls send `Authorization: Bearer <accessToken>`.
All write endpoints accept/return `application/json` unless noted. Validation errors return HTTP 400; auth failures 401; role violations 403.

### 5.1 Auth — `/api/auth` (controller: `AuthController`)

| # | Method & Path | Auth | Description |
|---|---|---|---|
| 1 | `POST /auth/register` | Public | Customer sign-up |
| 2 | `POST /auth/register/seller` | Public | Seller sign-up (starts approval flow) |
| 3 | `POST /auth/login` | Public | Authenticate, returns tokens |
| 4 | `POST /auth/refresh` | Public | Exchange refresh token for new tokens |
| 5 | `PUT /auth/profile` | Authenticated | Update own profile (name, phone, profile image) |

**1) Register** — body: `{ "email": "a@b.com", "password": "min 6 chars", "name": "...", "phone": "..." }` → `200` `AuthResponse`.

**2) Seller register** — body: `{ email, password, name, phone, "businessName": "*required*", "businessAddress", "gstNumber", "description" }` → `200` `AuthResponse`. Seller is created with approval status `PENDING` (UI blocks selling actions until approved — see `SellerApprovalBanner`).

**3) Login** — body: `{ email, password }` → `200`:
```json
{ "token": "<JWT>", "refreshToken": "<JWT type=refresh>", "userId": 1,
  "name": "...", "email": "...", "role": "CUSTOMER|SELLER|ADMIN" }
```
**4) Refresh** — body: `{ "refreshToken": "..." }` → same `AuthResponse` shape with fresh tokens. Client interceptor stores new tokens and replays the failed request.

### 5.2 Products — `/api/products`

| # | Method & Path | Auth | Description |
|---|---|---|---|
| 6 | `GET /products?q=&categoryId=&page=0&size=12` | Public | Paged search; `q` = name/keyword match |
| 7 | `GET /products/{id}` | Public | Product detail |
| 8 | `GET /products/{id}/ratings` | Public | Reviews for a product |
| 9 | `POST /products/{id}/ratings` | Authenticated | Create rating (1–5) + optional review |

**9) body:** `{ "rating": 4, "review": "optional text" }` → created `RatingDTO.Response` (id, productId, userId, userName, rating, review, createdAt).

### 5.3 Categories — `/api/categories`

| # | Method & Path | Auth | Description |
|---|---|---|---|
| 10 | `GET /categories` | Public | Active categories (id, name, …) — used by catalogue filter + forms |

### 5.4 Cart — `/api/cart` (in-memory per user)

| # | Method & Path | Auth | Description |
|---|---|---|---|
| 11 | `GET /cart` | Authenticated | Current cart with totals |
| 12 | `POST /cart/items` | Authenticated | Add item `{ "productId": 1, "quantity": 2 }` (quantity ≥ 1) |
| 13 | `PUT /cart/items/{productId}?quantity=N` | Authenticated | Set quantity; `quantity=0` removes |
| 14 | `DELETE /cart/items/{productId}` | Authenticated | Remove item |

**11) CartResponse:** `{ items: [{ id, productId, productName, productImage, unitPrice, quantity, totalPrice, stockQuantity }], subtotal, discount, giftPointDiscount, total, availableGiftPoints }`.

### 5.5 Orders — `/api/orders`

| # | Method & Path | Auth | Description |
|---|---|---|---|
| 15 | `POST /orders` | Authenticated | Place order from current cart |
| 16 | `GET /orders?page=&size=` | Authenticated | Own order history (newest first) |
| 17 | `POST /orders/{id}/cancel` | Authenticated | Cancel own order (owner-checked) |

**15) PlaceRequest:** `{ "addressId": 1 (required), "giftPointsToUse": 50 (optional), "paymentMethod": "CARD" (optional, default CARD) }`.
Flow: validates address + stock → redeems gift points (1 pt = ₹1, balance-checked) → creates order `PLACED` → creates **mock payment** (`TXN<millis>`, `COMPLETED`, INR) → order → `CONFIRMED` → awards **1 point per ₹100** of final amount → writes audit log → clears cart.
**Response:** `{ id, orderNumber, items: [OrderItemResponse…], totalAmount, discountAmount, giftPointsUsed, finalAmount, status, paymentStatus, canCancelUntil, createdAt, address }`.
**17)** allowed while `status != CANCELLED` and within the **48-hour** cancellation window (`can_cancel_until`); restores product stock.

### 5.6 Addresses — `/api/addresses`

| # | Method & Path | Auth | Description |
|---|---|---|---|
| 18 | `GET /addresses` | Authenticated | Own saved addresses |
| 19 | `POST /addresses` | Authenticated | Create address |
| 20 | `DELETE /addresses/{id}` | Authenticated | Delete own address (204) |

**19) CreateRequest:** `{ fullName*, phone*, addressLine1*, addressLine2, city*, state*, pincode*, country, isDefault }` (`*` = required).

### 5.7 File Upload — `/api/upload`

| # | Method & Path | Auth | Description |
|---|---|---|---|
| 21 | `POST /upload` | Authenticated | `multipart/form-data`, field `file` → returns URL string `/uploads/<uuid>.<ext>` |

Photo storage is **hot-swappable** via the `StorageService` interface:

- **Local mode** (`storage.s3.enabled=false`, default): files are written to `file.upload-dir` (`backend/uploads/`, gitignored) and served statically by `WebConfig` under `/uploads/**`.
- **S3 mode** (`storage.s3.enabled=true`): files are uploaded to an S3-compatible bucket (Neon Storage, AWS S3, Cloudflare R2, MinIO) using the AWS SDK v2 client (`S3FileStorageService`). The bucket is auto-discovered via `listBuckets` when `storage.s3.bucket` is empty. Because buckets are typically **private**, `S3ResourceController` streams objects back through `/uploads/**`, keeping the URL format identical in both modes (`/uploads/<uuid>.<ext>`).

Config: `storage.s3.endpoint`, `storage.s3.region`, `storage.s3.bucket`, `storage.s3.access-key`, `storage.s3.secret-key` (all env-overridable; see §9).

### 5.8 Seller — `/api/seller` (role `SELLER`; blocked until admin approval)

| # | Method & Path | Description |
|---|---|---|
| 22 | `GET /seller/dashboard` | KPIs: `{ totalProducts, totalOrders, pendingOrders, deliveredOrders, totalRevenue, averageRating }` |
| 23 | `GET /seller/orders?page=&size=` | Incoming orders (items across own products) → `SellerOrderResponse[]` `{ orderId, orderNumber, customerName, productName, quantity, unitPrice, totalPrice, status, createdAt }` |
| 24 | `PUT /seller/orders/{orderId}/status` | Body `{ "status": "PROCESSING|SHIPPED|DELIVERED|..." }` — advance fulfilment |
| 25 | `GET /seller/profile` | `{ id, businessName, businessAddress, gstNumber, description, logoUrl, approvalStatus }` |
| 26 | `PUT /seller/profile` | Same fields (partial update) |
| 27 | `GET /seller/products?page=&size=` | Own products, paged |
| 28 | `POST /seller/products` | Create product (below) |
| 29 | `PUT /seller/products/{id}` | Update (ownership-checked) |
| 30 | `DELETE /seller/products/{id}` | Delete (ownership-checked) |
| 31 | `GET /seller/ratings` | Ratings received on own products |

**28) ProductCreateRequest:** `{ name*, description, price* (>0), discountPrice, categoryId, stockQuantity* (≥0), imageUrls, isbn, author, publisher, publicationYear }` — `imageUrls` typically obtained first from endpoint #21.

### 5.9 Admin — `/api/admin` (role `ADMIN`)

| # | Method & Path | Description |
|---|---|---|
| 32 | `GET /admin/dashboard` | `{ totalSellers, pendingApprovals, totalProducts, totalOrders, totalCustomers }` |
| 33 | `GET /admin/sellers?status=PENDING` | Seller directory with `{ businessName, customerName, email, businessAddress, gstNumber, approvalStatus, approvedByName, productCount }` |
| 34 | `PUT /admin/sellers/{id}/approve` | Approve seller (records approver) |
| 35 | `PUT /admin/sellers/{id}/reject` | Reject seller |
| 36 | `DELETE /admin/sellers/{id}` | Remove seller entirely |
| 37 | `GET /admin/users?page=&size=` | All users `{ id, name, email, phone, role, status }` |
| 38 | `PUT /admin/users/{id}/status` | Body `{ "status": "ACTIVE" | "BLOCKED" }` |
| 39 | `GET /admin/categories` | All categories (incl. inactive) |
| 40 | `POST /admin/categories` | Create `{ "name": "*", "description", "isActive" }` |
| 41 | `PUT /admin/categories/{id}` | Update category |
| 42 | `DELETE /admin/categories/{id}` | Delete category |

---

## 6. Database Schema (Liquibase auto-provisioned)

11 tables created by migrations `001`–`011` in `src/main/resources/db/changelog/`; master file: `db.changelog-master.xml`. Hibernate `ddl-auto=none` — the schema is **entirely migration-managed**. Migration `015-sync-sequences` re-syncs PostgreSQL auto-increment sequences after the admin seed insert (fixes "duplicate key users_pkey" on fresh databases).

| Table | Purpose / key columns |
|---|---|
| `users` | id, email (unique), password_hash (BCrypt), name, phone, role (`CUSTOMER/SELLER/ADMIN`), status (`ACTIVE/BLOCKED`), profile_image |
| `seller_profiles` | user_id FK, business_name, business_address, gst_number, description, logo_url, approval_status (`PENDING/APPROVED/REJECTED`), approved_by |
| `categories` | name, description, is_active |
| `products` | seller_id FK, category_id FK, name, description, price, discount_price, stock_quantity, image_urls, isbn, author, publisher, publication_year, is_active |
| `addresses` | user_id FK, full_name, phone, address_line1/2, city, state, pincode, country, is_default |
| `orders` | order_number (unique), user_id FK, address_id FK, total_amount, discount_amount, gift_points_used, final_amount, status, payment_status, can_cancel_until (created+48h) |
| `order_items` | order_id FK, product_id FK, quantity, unit_price, total_price |
| `payments` | order_id FK, payment_method, amount, currency, transaction_id, status, gateway_response |
| `ratings` | product_id FK, user_id FK, rating (1–5), review |
| `gift_points` | user_id FK, points, type (`EARNED/REDEEMED`), description, order_id FK |
| `audit_log` | actor, action, entity_type, entity_id, details, timestamp |

**Seeded data (migrations 012/013):** admin user `admin@ebookstore.com` (role ADMIN) with a BCrypt password hash.

---

## 7. Key Business Rules & Flows

**Order lifecycle:** `PLACED → CONFIRMED` (auto after mock payment) `→ PROCESSING → SHIPPED → DELIVERED` (seller-driven via #24), with `CANCELLED` (customer within 48 h via #17, or admin action). Payment statuses: `PENDING → COMPLETED` (mock) / `FAILED / REFUNDED`.

**Gift points (loyalty):**
- **Earn:** 1 point per ₹100 of `finalAmount` (integer division), recorded as `EARNED` linked to the order.
- **Redeem:** at checkout, `giftPointsToUse` ≤ current balance; each point = ₹1 discount; recorded as `REDEEMED`; final amount never below 0.
- Cart response exposes `availableGiftPoints` so the UI can cap redemption.

**Seller approval workflow:** seller registers (#2, `PENDING`) → admin approves (#34, `APPROVED`) or rejects (#35) → sellers with non-approved status are blocked from seller actions (UI shows `SellerApprovalBanner`; backend enforces role checks).

**Ownership & authorization:** seller product/order mutations verify ownership in the service layer; customer order cancel verifies the order belongs to the caller; addresses scoped to the owning user. Role gates are enforced by `SecurityConfig` URL rules.

**Audit trail:** significant actions (e.g., `PLACE_ORDER`) are recorded via `AuditService` into `audit_log`.

---

## 8. Frontend Implementation Notes

- **State:** `authStore` (Zustand) persists `{userId, name, email, role, token, refreshToken, profileImageUrl}` to `localStorage`; session is validated by decoding the JWT `exp` on load — expired sessions are cleared.
- **Networking:** `services/api.ts` — request interceptor attaches `Bearer` token; response interceptor on `401` calls `/auth/refresh` once, updates stored tokens, replays the original request; on refresh failure it logs out and redirects to `/login`. `getErrorMessage()` maps backend/error statuses to friendly toasts (incl. the "seller awaiting approval" case for 403 on `/seller/*`).
- **Server state:** React Query for catalogue/product/dashboard fetches; Zustand for auth; `react-hot-toast` for notifications.
- **Styling:** Tailwind CSS with a warm "bookstore" palette (see `tailwind.config.js`); `Ui.tsx` holds shared buttons/cards/badges; `StateViews` renders loading/empty/error states.
- **Dev proxy:** `vite.config.ts` proxies `/api` and `/uploads` → `http://localhost:8080`, so no CORS issues locally and the client code stays base-URL free.

---

## 9. Configuration, Secrets & Credentials

**Where secrets live (and don't):** the repository contains **no secrets**. `application.properties` holds safe placeholders with env-var overrides; private values go in `application-local.properties` (**gitignored**, template: `application-local.properties.example`) or environment variables.

| Env var | Overrides |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection (Neon: use `jdbc:postgresql://<host>?sslmode=require`) |
| `JWT_SECRET` | token-signing key (Base64, ≥ 32 bytes) |
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | token lifetimes (ms) |
| `S3_ENABLED` | `true` = object storage, `false` = local disk |
| `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `S3_BUCKET` | object-storage endpoint / region / bucket (bucket auto-discovered if blank) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | object-storage credentials |
| `FILE_UPLOAD_DIR`, `SERVER_PORT` | uploads path (local mode), HTTP port |
| `SPRING_PROFILES_ACTIVE` | profile (default `local`) |
| `VITE_API_BASE_URL` | Frontend API base URL; set to absolute URL to connect directly to backend (bypasses Vercel rewrites). Leave unset in production and use `vercel.json` rewrites instead. | `/api` |

**Rotate the JWT secret** (recommended immediately after handover): generate a Base64 key (`[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('<any 32+ char string>'))` in PowerShell), set `JWT_SECRET` (or edit the local properties file), restart. Rotating invalidates all existing tokens (users simply log in again).

**Reset the admin password:** the seeded hash is in `013-fix-admin-password.xml`. To set a known password, generate a BCrypt hash for the new password (e.g., with `new BCryptPasswordEncoder().encode("newPass")` in a test, or any bcrypt generator) and run:
```sql
UPDATE users SET password_hash = '<bcrypt-hash>' WHERE email = 'admin@ebookstore.com';
```
*(Or create a fresh admin by registering, then updating the `role` column.)*

**Production CORS:** update `http://localhost:5173` in `SecurityConfig#corsConfigurationSource` and `WebConfig#addCorsMappings` to your real frontend origin.

---

## 10. Build, Run & Deploy

**Frontend (Vercel)** — the recommended production path:

1. Push your fork to GitHub.
2. On [Vercel](https://vercel.com/new), import the repo and set **Root Directory** → `frontend/`.
3. Edit `frontend/vercel.json` — replace `https://YOUR_BACKEND_URL.com` in both rewrite rules with your deployed backend's base URL (e.g. `https://api.ebookstore.com`).
4. Click **Deploy**. Vercel runs `npm install && npm run build` automatically; `dist/` is served as static assets.
5. *(Optional)* Set env var `VITE_API_BASE_URL=https://api.ebookstore.com` in **Project Settings → Environment Variables** — use this only if you bypass the rewrites and connect directly (requires backend CORS update).

> With Vercel rewrites, `/api/*` and `/uploads/*` are proxied server-side — no CORS configuration needed on the backend, and no secrets are exposed to the browser.

**Backend** — deploy the Spring Boot JAR on any host with Java 17 + network access to PostgreSQL:

1. ```bash
   cd backend
   mvn clean package          # produces target/ebookstore-1.0.0.jar
   ```
2. Set environment variables (or supply `application-local.properties`):
   `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `S3_ENABLED`, `AWS_*` / `S3_BUCKET`
3. ```bash
   java -jar target/ebookstore-1.0.0.jar
   ```
4. **Production hardening**: update CORS origins in `SecurityConfig` + `WebConfig` to your real Vercel domain; set `SPRING_PROFILES_ACTIVE` to a non-`local` profile; front with HTTPS (use a reverse proxy like Nginx — see below).

**Render (Docker)** — deploy the backend as a managed Docker web service:

1. Create a **Web Service** on [Render](https://dashboard.render.com/new) → import your repo → **Root Directory** = `backend/`.
2. Select **Docker** as the runtime (Render auto-detects `backend/Dockerfile`).
3. In the Dashboard → **Environment → Add Environment Variable**, add (all are secret):
   `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `S3_ENABLED=true`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET=photos`, `AWS_REGION=us-east-2`.
4. Alternatively, use the repo's `render.yaml` (infra-as-code) — it pre-declares the non-secret env vars; you only need to fill in the secret ones in the Dashboard.
5. Click **Deploy**. Render builds the multi-stage Docker image (~250 MB) and runs it on the free tier (upgrade for production).
6. Once deployed, you get a URL like `https://ebookstore-api.onrender.com`.
7. **Update `frontend/vercel.json`** — replace `YOUR_BACKEND_URL.com` with this URL, then click **Redeploy** on Vercel.

**Nginx reverse-proxy** (optional, if you host the frontend on the same host as the backend):
```nginx
server {
  listen 80;
  server_name yourdomain.com;

  location / {
    root /path/to/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  location /api/ { proxy_pass http://localhost:8080; }  # backend
  location /uploads/ { proxy_pass http://localhost:8080; }  # image serving
}
```
**Deployment checklist:** provision PostgreSQL (local or Neon cloud) → set `DB_*`, `JWT_SECRET` env vars → enable object storage with `S3_ENABLED=true` + `AWS_*` / `S3_BUCKET` vars (or keep local disk) → set `SPRING_PROFILES_ACTIVE` to something other than `local` → front the API with HTTPS → update CORS origins to your real frontend domain → deploy frontend on Vercel (edit `vercel.json` with backend URL). See §10 above for step-by-step Vercel and backend deployment instructions.

---

## 11. Operational Procedures (Day-to-Day)

### How to change the backend URL on Vercel

**File:** `frontend/vercel.json`
**What to change:** The `destination` URLs in the two rewrite rules
**Effect:** Frontend proxies API + image requests to the new backend

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://NEW_BACKEND_URL.com/api/:path*" },
    { "source": "/uploads/:path*", "destination": "https://NEW_BACKEND_URL.com/uploads/:path*" }
  ]
}
```

1. Edit `frontend/vercel.json` locally
2. `git push origin main` → Vercel auto-deploys (~1 min)
3. Verify: `curl -I https://your-frontend.vercel.com/api/products` → should return 200

### How to change environment variables (Render backend)

1. Go to [Render Dashboard](https://dashboard.render.com) → your `ibm-capstone` service
2. Click **Environment** in the left sidebar
3. Edit or add key-value pairs
4. Click **Save** → Render **does NOT auto-redeploy on env change**
5. To apply: click **Manual Deploy** → **Deploy latest commit**

### How to add a new API endpoint

1. Create a method in the appropriate `backend/src/main/java/com/capstone/controller/*.java`
2. Ensure the URL pattern matches the security rules in `SecurityConfig`
3. Test locally: `cd backend && mvn spring-boot:run`
4. `git push origin main` → Render builds & deploys (~3–5 min)

### How to change the database schema

1. Add new changelog: `backend/src/main/resources/db/changelog/NNN-name.xml`
2. Register it in `db.changelog-master.xml`
3. Push → Render auto-applies the changelog on startup

### How to modify CORS / allowed origins

**Files:** `backend/src/main/java/com/capstone/config/SecurityConfig.java` and `WebConfig.java`
Both have `http://localhost:5173` hardcoded. Replace with your Vercel domain for production.

### How to rotate secrets

1. New JWT key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Render Dashboard → Environment → update value → Manual Deploy

### How to access the database directly

Neon Console at [console.neon.tech](https://console.neon.tech) → Query tab, or any Postgres client with the connection details in §12.

### How to view logs

- **Render:** Dashboard → service → **Logs** tab
- **Vercel:** Dashboard → project → Deployments → click → Runtime Logs

### How to roll back

**Render:** Dashboard → service → **Deploys** tab → click previous deploy → **Rollback**
**Git:** `git revert <commit-hash>` → `git push origin main`

### How to take the site down / pause

**Render:** Dashboard → service → **Settings** → scroll down → **Pause Service** (stops all traffic + billing)

### Render pricing & upgrade path

| Plan | CPU | RAM | Cost |
|---|---|---|---|
| Free | 0.1 | 512 MB | $0 (spins down after 15 min idle) |
| 0.5c-512mb | 0.5 | 512 MB | $7/mo |
| 1c-2g | 1 | 2 GB | $25/mo (recommended) |
| 2c-4g | 2 | 4 GB | $85/mo |

---

## 12. Environment Variables — Complete Reference

### Backend (Render — set in Dashboard)

| Variable | Required | Current Value | Purpose |
|---|---|---|---|
| `DB_URL` | yes | `jdbc:postgresql://ep-cool-king-a5z3tv34-pooler.us-east-2.aws.neon.tech/ebookstore?sslmode=require&channel_binding=require` | Neon PostgreSQL |
| `DB_USERNAME` | yes | `neondb_owner` | Database username |
| `DB_PASSWORD` | yes | `npg_pBqifXAx6P2C` | Database password |
| `JWT_SECRET` | yes | `LKglo+fU+Q5LtvX45MCQUVUlQhIqpguygHpWHEneCWU=` | HS256 signing key (Base64) |
| `S3_ENABLED` | yes | `true` | `true` = Neon Storage, `false` = local disk |
| `AWS_ENDPOINT_URL_S3` | if S3 | `https://br-square-flower-a52a0ppq.storage.c-1.us-east-2.aws.neon.tech` | S3 endpoint |
| `AWS_ACCESS_KEY_ID` | if S3 | `nak_live_adfe0d0f5b59428ca41201eda38cf22a` | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | if S3 | `nsk_live_85f9863e9816348c1f1b237ed3e74afd84b4c31be8103571b99e6ee324563b94` | S3 secret key |
| `S3_BUCKET` | if S3 | `photos` | Image bucket |
| `AWS_REGION` | if S3 | `us-east-2` | S3 region |
| `PORT` | auto | *(injected by Render)* | Do NOT set manually |

### Frontend (Vercel — set in Dashboard or `frontend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | no | `/api` | Absolute URL for local dev only |

---

## 13. Credential Inventory

| Secret | Where stored | How to change |
|---|---|---|
| Neon DB password | Neon console + Render env var | Change in Neon → update `DB_PASSWORD` → redeploy |
| JWT signing key | Render env var only | Render Dashboard → update `JWT_SECRET` → redeploy |
| S3 access keys | Render env var only | Render Dashboard → update keys → redeploy |
| GitHub PAT | User's GitHub settings | github.com/settings/tokens |
| Render account | User's email/password | render.com |
| Vercel account | User's email/password | vercel.com |
| Neon account | User's email/password | console.neon.tech |

> ⚠️ Neon DB owner password and S3 secret key are stored ONLY in Render Dashboard env vars and the local `render.env` file (gitignored). Never committed to GitHub.

---

## 14. File Map — What to Edit When

| I want to... | File(s) to edit | Then |
|---|---|---|
| Change an API endpoint URL | `backend/src/main/java/com/capstone/controller/*.java` | `git push` |
| Add a database table/column | `backend/src/main/resources/db/changelog/NNN-name.xml` + register in `db.changelog-master.xml` | `git push` |
| Change a business rule (pricing, gift points) | `backend/src/main/java/com/capstone/service/*.java` | `git push` |
| Add a frontend page | `frontend/src/pages/MyPage.tsx` + route in `frontend/src/App.tsx` | `git push` |
| Change frontend styling | `frontend/src/**/*.tsx` or `frontend/src/index.css` | `git push` |
| Change backend env vars | Render Dashboard → Environment | Save → Manual Deploy |
| Change frontend env vars | `frontend/.env` (local) or Vercel Dashboard | `git push` or redeploy |
| Change Render service config | Render Dashboard → Settings | Save |
| Change Vercel's backend URL | `frontend/vercel.json` | `git push` |
| Change Vercel's root directory | Vercel Dashboard → Settings | Save |

---

## 15. Known Limitations & Recommended Next Steps

1. **In-memory cart** — carts reset on backend restart and don't scale horizontally. *Next:* persist cart in a `cart_items` table or Redis.
2. **Mock payment gateway** — payments always succeed. *Next:* integrate Razorpay/Stripe; flip order/payment statuses from the gateway webhook.
3. **No refresh-token revocation** — tokens are stateless; logout is client-side only. *Next:* token blacklist or short-lived tokens with server-side sessions.
4. **Photos streamed through the app in S3 mode** — private buckets mean `S3ResourceController` relays objects via `/uploads/**`. *Next:* switch to a public bucket/CDN or presigned URLs for direct browser access.
5. **No automated tests beyond the default context test.** *Next:* unit tests for services (pricing, gift points, stock), API tests with Testcontainers.
6. **Seller approval enforcement** — primarily UI-driven (`SellerApprovalBanner`); consider adding a `@PreAuthorize`-style service check for extra hardening.
7. **Rate limiting / brute-force protection** on `/auth/login` — add Bucket4j or a gateway.

---

*End of handover document — last updated at project delivery. For the public-facing summary see `README.md`.*


