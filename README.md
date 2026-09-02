# 📚 eBookStore — Multi-Vendor E-Commerce Bookstore Platform

![Java](https://img.shields.io/badge/Java-17-orange) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue) ![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red)

A full-stack **multi-vendor bookstore marketplace** with three roles — **Customer**, **Seller**, and **Admin** — featuring seller onboarding with admin approval, product catalogue with search & ratings, cart & checkout, a gift-points loyalty system, order lifecycle management, and JWT-based stateless security.

> 📖 **Buyer / implementation documentation:** see [`HANDOVER.md`](./HANDOVER.md) for the complete module-by-module and endpoint-by-endpoint reference.

---

## ✨ Features

**🛒 Customer**
- Register / login (JWT with refresh-token rotation)
- Browse catalogue, keyword search, filter by category, pagination
- Product detail pages with customer ratings & reviews (1–5 stars)
- Cart management (add / update / remove items)
- Checkout with saved addresses, gift-point redemption, mock payment
- Order history, order tracking, self-service cancellation (within 48 h)
- Loyalty rewards: earn 1 gift point per ₹100 spent; 1 point = ₹1 discount

**🏪 Seller**
- Seller registration → admin approval workflow (`PENDING → APPROVED/REJECTED`)
- Seller dashboard: products, orders, pending orders, delivered orders, revenue, average rating
- Product CRUD with image upload
- Incoming order management with fulfilment status updates
- View customer ratings received

**🛡️ Admin**
- Platform dashboard (sellers, customers, products, orders, pending approvals)
- Seller approval / rejection / removal
- User management (activate / block accounts)
- Category management (CRUD)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2 (Web, Data JPA, Security, Validation) + AWS SDK v2 (S3) |
| Security | Spring Security + JWT (access + refresh tokens), BCrypt password hashing |
| Database | PostgreSQL (local or Neon cloud) + Liquibase versioned migrations (auto-provisioned schema) |
| Photo Storage | S3-compatible object storage (Neon Storage / AWS S3 / R2 / MinIO) or local disk, hot-swappable |
| API Docs | springdoc-openapi (Swagger UI) |
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS |
| State/Data | Zustand (auth store), React Query, Axios interceptors (auto token refresh) |
| Notifications | react-hot-toast |

---

## 🏗️ Architecture

```
┌─────────────────────┐         ┌──────────────────────────────┐
│  React SPA (Vite)   │  /api   │  Spring Boot REST API        │
│  localhost:5173     │ ──────► │  localhost:8080              │
│  Zustand + Axios    │ /uploads│  JWT filter → Services       │
└─────────────────────┘  proxy  │        → JPA Repositories    │
                                └──────────────┬───────────────┘
                                               ▼
                                 ┌──────────────────────────┐
                                 │ PostgreSQL + Liquibase   │
                                 │ 11 versioned migrations  │
                                 └──────────────────────────┘
```

### Project structure

```
├── backend/                  # Spring Boot REST API
│   └── src/main/java/com/capstone/
│       ├── controller/       # 9 REST controllers (Auth, Product, Cart, Order, ...)
│       ├── service/          # Business logic
│       ├── repository/       # Spring Data JPA repositories
│       ├── entity/           # JPA entities (User, Product, Order, Payment, ...)
│       ├── dto/              # Request/response payloads
│       ├── security/         # JWT util + auth filter + user details service
│       └── config/           # Security, CORS, static resource config
│   └── src/main/resources/db/changelog/   # Liquibase migrations
└── frontend/                 # React + TypeScript SPA
        ├── .env.example          # Frontend env var template (VITE_API_BASE_URL)
    ├── vercel.json           # Vercel rewrites: /api + /uploads → backend
    └── src/
        ├── pages/            # Landing, Catalogue, Cart, Checkout, admin/*, seller/*
        ├── components/       # Shared UI components
        ├── services/api.ts   # Axios instance + interceptors
        ├── store/            # Zustand auth store
        └── layouts/          # App shell / navigation
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+** and **Maven 3.8+**
- **Node.js 18+** and npm
- **PostgreSQL 14+** running locally

### 1. Database
Create an empty database — Liquibase creates all tables automatically on first run:
```sql
CREATE DATABASE ebookstore;   -- local PostgreSQL
```
Or use a **managed Neon database** (`postgresql://...`), connecting over SSL:
```properties
spring.datasource.url=jdbc:postgresql://<host>.neon.tech/<db>?sslmode=require
```

### 2. Configure secrets (never committed)
```bash
cd backend/src/main/resources
copy application-local.properties.example application-local.properties   # Windows
# cp application-local.properties.example application-local.properties   # macOS/Linux
```
Edit `application-local.properties` and set your DB credentials (local or Neon), a private JWT secret, and optionally the object-storage settings. Every value can also be provided via environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `S3_ENABLED`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, …) — see the configuration table below.

### 3. Run the backend
```bash
cd backend
mvn spring-boot:run
```
API is live at `http://localhost:8080` · Swagger UI: `http://localhost:8080/swagger-ui.html`

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
App opens at `http://localhost:5173` (Vite proxies `/api` and `/uploads` to the backend).

### Default admin account
An admin is seeded by migration `012/013`: **`admin@ebookstore.com`** (password delivered privately with the project — see [`HANDOVER.md`](./HANDOVER.md) for how to reset it).

---

## 🚀 Deployment (Live)

The application is deployed as a **frontend + backend split**:

| Service | Platform | URL | Status |
|---|---|---|---|
| **Backend API** | Render (Docker) | `https://ibm-capstone.onrender.com` | ✅ Live |
| **Frontend SPA** | Vercel | *Deploy separately* | ⬜ — |
| **Database** | Neon PostgreSQL 15 | Auto-provisioned by Liquibase | ✅ Connected |
| **Photo Storage** | Neon Storage (S3) | Bucket `photos` | ✅ Configured |

**Auto-deploy:** every `git push origin main` triggers fresh deploys on both platforms. Render watches `backend/`, Vercel watches `frontend/`.

### Quick start (local dev)

```bash
# Backend  —  http://localhost:8080
cd backend && mvn spring-boot:run

# Frontend  —  http://localhost:5173 (proxies /api → backend)
cd frontend && npm install && npm run dev
```

### Frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import `ananyasenapati/ibm_capstone`
2. Set **Root Directory** to `frontend/`
3. Edit `frontend/vercel.json` — replace `YOUR_BACKEND_URL.com` with `https://ibm-capstone.onrender.com` in both rewrite rules
4. Click **Deploy**

> The `vercel.json` rewrites route `/api/*` and `/uploads/*` to the backend — no CORS config needed, no secrets in the frontend bundle.

### Backend on Render (Docker)

1. Create a **Web Service** on [Render](https://dashboard.render.com/new) → import `ananyasenapati/ibm_capstone`
2. **Root Directory** → `backend/` · **Runtime** → Docker
3. In **Environment**, click **Add from .env** and upload `render.env` (in repo root)
4. Click **Deploy** (~3–5 min for Maven build)
5. Get the URL: `https://ibm-capstone.onrender.com`
6. Update `frontend/vercel.json` with this URL → redeploy Vercel

> `render.yaml` at repo root defines the service as infrastructure-as-code.

---

## ⚙️ Configuration

All values support environment-variable overrides — no secrets are stored in the repository.

| Variable | Purpose | Default (dev) |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC URL (local or Neon `?sslmode=require`) | `jdbc:postgresql://localhost:5432/ebookstore` |
| `DB_USERNAME` / `DB_PASSWORD` | Database credentials | `postgres` / `postgres` |
| `JWT_SECRET` | Base64 key, ≥ 32 bytes (HS256) | dev-only placeholder — **override in production** |
| `JWT_EXPIRATION` | Access-token lifetime (ms) | `86400000` (24 h) |
| `JWT_REFRESH_EXPIRATION` | Refresh-token lifetime (ms) | `604800000` (7 days) |
| `S3_ENABLED` | `true` → object storage, `false` → local disk (`uploads/`) | `false` |
| `AWS_ENDPOINT_URL_S3` | S3 endpoint (e.g. Neon Storage, AWS, R2, MinIO) | — |
| `AWS_REGION` | S3 region | `us-east-2` |
| `S3_BUCKET` | Bucket name (auto-discovered if blank) | — |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Object-storage credentials | — |
| `FILE_UPLOAD_DIR` | Local-disk upload directory (local mode) | `uploads/` |
| `SERVER_PORT` | Backend port | `8080` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `local` |
| `VITE_API_BASE_URL` | Frontend API base URL (set to absolute URL to bypass Vercel rewrites) | `/api` |

---

## 📡 API Overview

Base URL: `/api` · Auth: `Authorization: Bearer <token>`

| Module | Endpoints | Access |
|---|---|---|
| Auth | `register`, `register/seller`, `login`, `refresh`, `PUT profile` | Public / Authenticated |
| Products | search, detail, ratings (list + create) | Public (create rating: Customer) |
| Categories | list active | Public |
| Cart | get, add item, update qty, remove item | Customer |
| Orders | place, history (paged), cancel | Customer |
| Addresses | list, create, delete | Authenticated |
| Upload | image upload (multipart) | Authenticated |
| Seller | dashboard, orders + status updates, profile, product CRUD, ratings | Seller |
| Admin | dashboard, seller approval, users, categories | Admin |

➡️ **Full request/response reference for every endpoint:** [`HANDOVER.md`](./HANDOVER.md).

---

## 🔒 Security Notes
- Stateless JWT auth with automatic refresh-token rotation on the client
- BCrypt password hashing; role-based access control (`ADMIN`, `SELLER`, `CUSTOMER`)
- CORS restricted to the frontend origin; CSRF disabled (stateless API)
- Photos: with object storage enabled, images are stored in a private S3-compatible bucket and streamed through the API's `/uploads/**` endpoint (no public bucket exposure)
- No secrets in version control — private values live in a gitignored local profile or environment variables
- On Vercel, API and image requests are reverse-proxied via `vercel.json` rewrites so no secrets are needed in the frontend bundle; CORS remains server-only

## 📄 License
All rights reserved. This source code is licensed to the purchaser only and may not be redistributed or resold without permission.
