# 📘 eBookStore — Complete Implementation Guide (Project Handover)

> **Confidential — for the project purchaser only.** This document describes every module, every REST API endpoint, the database schema, business rules, and operational knowledge required to run, maintain, and extend the platform.

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
| Liquibase | bundled | 15 changelogs in `src/main/resources/db/changelog/` |
| PostgreSQL | 14+ recommended | schema auto-created by Liquibase |
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
| 21 | `POST /upload` | Authenticated | `multipart/form-data`, field `file` → returns public URL string `/uploads/<uuid>.<ext>` |

Files are stored in `file.upload-dir` (default `backend/uploads/`, gitignored) and served statically by `WebConfig`. Used for product and profile images.

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

11 tables created by migrations `001`–`011` in `src/main/resources/db/changelog/`; master file: `db.changelog-master.xml`. Hibernate `ddl-auto=none` — the schema is **entirely migration-managed**.

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
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET` | token-signing key (Base64, ≥ 32 bytes) |
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | token lifetimes (ms) |
| `FILE_UPLOAD_DIR`, `SERVER_PORT` | uploads path, HTTP port |
| `SPRING_PROFILES_ACTIVE` | profile (default `local`) |

**Rotate the JWT secret** (recommended immediately after handover): generate a Base64 key (`[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('<any 32+ char string>'))` in PowerShell), set `JWT_SECRET` (or edit the local properties file), restart. Rotating invalidates all existing tokens (users simply log in again).

**Reset the admin password:** the seeded hash is in `013-fix-admin-password.xml`. To set a known password, generate a BCrypt hash for the new password (e.g., with `new BCryptPasswordEncoder().encode("newPass")` in a test, or any bcrypt generator) and run:
```sql
UPDATE users SET password_hash = '<bcrypt-hash>' WHERE email = 'admin@ebookstore.com';
```
*(Or create a fresh admin by registering, then updating the `role` column.)*

**Production CORS:** update `http://localhost:5173` in `SecurityConfig#corsConfigurationSource` and `WebConfig#addCorsMappings` to your real frontend origin.

---

## 10. Build, Run & Deploy

**Backend**
```bash
cd backend
mvn clean package                 # produces target/ebookstore-1.0.0.jar
java -jar target/ebookstore-1.0.0.jar   # set env vars, or rely on local profile
```
**Frontend**
```bash
cd frontend
npm install
npm run dev        # development (port 5173)
npm run build      # production bundle in dist/
npm run preview    # serve the production build
```
**Deployment checklist:** provision PostgreSQL → set `DB_*`, `JWT_SECRET` env vars → set `SPRING_PROFILES_ACTIVE` to something other than `local` → update CORS origins → front the API with HTTPS → persist/serve `uploads/` from durable storage (or an S3-style bucket) → point the built frontend's `/api` + `/uploads` at the API host (reverse proxy such as Nginx keeps the same paths).

---

## 11. Known Limitations & Recommended Next Steps

1. **In-memory cart** — carts reset on backend restart and don't scale horizontally. *Next:* persist cart in a `cart_items` table or Redis.
2. **Mock payment gateway** — payments always succeed. *Next:* integrate Razorpay/Stripe; flip order/payment statuses from the gateway webhook.
3. **No refresh-token revocation** — tokens are stateless; logout is client-side only. *Next:* token blacklist or short-lived tokens with server-side sessions.
4. **File uploads on local disk** — *Next:* object storage + CDN.
5. **No automated tests beyond the default context test.** *Next:* unit tests for services (pricing, gift points, stock), API tests with Testcontainers.
6. **Seller approval enforcement** — primarily UI-driven (`SellerApprovalBanner`); consider adding a `@PreAuthorize`-style service check for extra hardening.
7. **Rate limiting / brute-force protection** on `/auth/login` — add Bucket4j or a gateway.

---

*End of handover document — last updated at project delivery. For the public-facing summary see `README.md`.*


