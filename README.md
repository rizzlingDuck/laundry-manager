#  LaundryPro — Mini Laundry Order Management System

A full-stack laundry/dry cleaning order management system built with **Node.js**, **React**, and **SQLite**.

---

## 🌐 Live Demo

- **Frontend UI:** [https://laundry-manager-1.onrender.com](https://laundry-manager-1.onrender.com)
- **Backend API:** [https://laundry-manager-wrjf.onrender.com](https://laundry-manager-wrjf.onrender.com)

> [!WARNING]
> **Cold Start Delay:** This project is deployed on Render's free tier. If the backend hasn't received traffic in 15 minutes, it will spin down. **The first request may take up to 50 seconds to respond** while the server wakes up. Please be patient on the first load!

> [!NOTE]
> **Database Persistence:** Because the free tier uses an ephemeral filesystem, the SQLite database will reset to its initial state every time the server spins down. For a production system, this would be swapped to a persistent PostgreSQL instance via an ORM, but the ephemeral SQLite is used here to safely demonstrate the architecture.

---

##  Setup Instructions

### Prerequisites
- **Node.js** v18+ installed
- **npm** v9+

### 1. Clone the repository
```bash
git clone https://github.com/rizzlingDuck/laundry-manager.git
cd laundry-manager
```

### 2. Start the Backend
```bash
cd server
npm install
npm run dev
```
The API will start on **http://localhost:3001**

### 3. Start the Frontend
```bash
cd client
npm install
npm run dev
```
The frontend will start on **http://localhost:3000**

### 4. Use the App
1. Open **http://localhost:3000** in your browser
2. **Register** a new account (any username/password)
3. Start creating orders!

---

##  Features Implemented

### Core Features
| Feature | Status | Description |
|---------|--------|-------------|
| Create Order | ✅ | Customer name, phone, garment selection with quantity & pricing |
| Unique Order ID | ✅ | Auto-generated `ORD-XXXXXXXX` format |
| Total Bill Calculation | ✅ | Real-time calculation as items are added |
| Order Status Management | ✅ | RECEIVED → PROCESSING → READY → DELIVERED (forward-only) |
| View All Orders | ✅ | Paginated list with all order details |
| Filter by Status | ✅ | One-click filter buttons for each status |
| Filter by Customer/Phone | ✅ | Search bar with auto-detection (digits = phone, text = name) |
| Dashboard | ✅ | Total orders, revenue, orders per status, top garments, recent orders |

### Bonus Features
| Feature | Status | Description |
|---------|--------|-------------|
| React Frontend | ✅ | Full SPA with React + Vite |
| JWT Authentication | ✅ | Register/Login with token-based auth |
| SQLite Database | ✅ | Persistent data storage with better-sqlite3 |
| Search by Garment Type | ✅ | Filter orders containing specific garment types |
| Estimated Delivery Date | ✅ | Auto-calculated based on garment processing times |
| Delete Order | ✅ | Can delete orders in RECEIVED status only |

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcryptjs |
| Frontend | React 19 + Vite |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Styling | Vanilla CSS (dark theme) |

---

##  Project Structure

```
laundry-manager/
├── server/                     # Backend API
│   ├── src/
│   │   ├── config/
│   │   │   └── pricing.js      # Garment prices & processing times
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # Register/Login endpoints
│   │   │   ├── orders.js       # CRUD + filters for orders
│   │   │   └── dashboard.js    # Dashboard statistics
│   │   ├── db.js               # SQLite database setup
│   │   └── index.js            # Express server entry point
│   ├── data/                   # SQLite database file (auto-created)
│   └── package.json
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx      # Sidebar layout
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx    # Login/Register
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── OrdersPage.jsx  # Orders list with filters
│   │   │   ├── CreateOrderPage.jsx
│   │   │   └── OrderDetailPage.jsx
│   │   ├── api.js              # Axios instance with JWT interceptor
│   │   ├── App.jsx             # Main app with routing
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Full design system
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

---

##  API Documentation

### Authentication
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ username, password }` | Register new user |
| POST | `/api/auth/login` | `{ username, password }` | Login, returns JWT |

### Orders (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders (with filters) |
| GET | `/api/orders/:id` | Get single order |
| PATCH | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Delete order (RECEIVED only) |

### Dashboard (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get all dashboard stats |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/pricing` | Get garment pricing |

#### Query Parameters for GET `/api/orders`
- `status` — Filter by status (RECEIVED, PROCESSING, READY, DELIVERED)
- `customer` — Filter by customer name (partial match)
- `phone` — Filter by phone number (partial match)
- `garment` — Filter by garment type (partial match)
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 50)

#### Create Order Body
```json
{
  "customerName": "Rahul Sharma",
  "phone": "9876543210",
  "items": [
    { "garmentType": "Shirt", "quantity": 3 },
    { "garmentType": "Pants", "quantity": 2 },
    { "garmentType": "Saree", "quantity": 1 }
  ]
}
```

#### Update Status Body
```json
{ "status": "PROCESSING" }
```

---

## 🤖 AI Usage Report

### Tools Used
| Tool | Purpose |
|------|---------|
| **Antigravity (Google DeepMind)** | Primary coding assistant — architecture, scaffolding, full implementation |

### Prompts I Used

#### Prompt 1 — Architecture & Scaffolding
> *"Design and scaffold a full-stack REST API for a laundry management system. Use Node.js/Express and SQLite (WAL mode) for the backend to minimize setup while ensuring data durability. Create a modular route structure and a robust database schema with foreign key constraints for users, orders, and order_items. Include a centralized pricing configuration. Wait for my approval on the architecture before proceeding."*

**What AI did:** Chose Express + SQLite + React stack, designed the DB schema with indexes, created the entire project structure (8 backend files, 8 frontend files) in ~8 minutes.

**What I had to guide:** I had to approve the tech stack choice. AI initially offered a plan and waited for my approval — the plan was solid so I said "sure go ahead."

#### Prompt 2 — Security & Edge-Case Audit
> *"Perform a comprehensive security and edge-case audit on the Express routes and React frontend. Specifically check for floating-point precision issues in billing, UUID collision handling, pagination limit abuse, and bcrypt DoS vulnerabilities via excessive password lengths. Provide an implementation plan with a list of fixes."*

**What AI did:** Systematically read every file (routes, middleware, DB schema, all React pages, CSS), identified 48 edge cases across 8 files, and implemented fixes with test verification.

**What was impressive:** AI caught security issues I wouldn't have thought of — like bcrypt accepting strings of unlimited length (DoS vector) and UUID collision potential from `slice(0, 8)`.

#### Prompt 3 — Deliverables Verification
> *"Cross-reference our current implementation against the original assignment rubric. Identify any missing deliverables, specifically looking at the 'Bonus Tasks' and 'Deliverables' sections. Generate any missing artifacts, such as the required API documentation or Postman collection."*

**What AI did:** Cross-referenced the assignment rubric against the current deliverables, identified the Postman collection was missing (explicitly listed as a deliverable), and generated a comprehensive 22-request JSON collection.

### Where AI Got Things Wrong

| Issue | What Happened | How I Fixed It |
|-------|--------------|----------------|
| **Port conflicts** | AI set the backend to port 5000, which was occupied. Then it tried 5050, 5555, 4444, 8787, 9292 — all failed because `node --watch` spawns zombie child processes that grab ports. | AI eventually switched from `npm run dev` (which uses `--watch`) to `node src/index.js` directly, and killed the zombie processes with `taskkill /PID`. **Lesson:** `--watch` mode on Windows creates child processes that survive parent crashes. |
| **Quantity input UX** | The browser automation test typed "2" into a quantity field that already had "1", resulting in "12" instead of replacing it. This is a quirk of how Playwright handles number inputs. | Not a code bug — but it revealed that the `<input type="number">` should have better UX. Added `onBlur` handler to snap invalid values back to 1. |
| **Missing `req.body` guard** | AI's initial auth routes did `const { username, password } = req.body` without checking if `req.body` exists. If someone sends a malformed request without proper JSON headers, this crashes. | Added `|| {}` fallback: `const { username, password } = req.body \|\| {}` |
| **Pagination NaN** | The initial `GET /orders` route passed `parseInt(page)` directly to SQL OFFSET. If `page=abc`, `parseInt` returns `NaN`, causing a SQLite error. | Created a `sanitizePagination()` helper that defaults invalid values and caps limit at 100. |
| **No status skip guard** | AI implemented "forward-only" status transitions but allowed skipping (RECEIVED → READY was valid). In a real laundry, you can't mark something ready without processing it. | Added check: `if (newIdx > currentIdx + 1)` to enforce step-by-step transitions. |
| **Delete not atomic** | The delete endpoint ran two separate SQL statements (delete items, then delete order). If the server crashed between them, you'd have orphaned items. | Wrapped both in a `db.transaction()` for atomic deletion. |

### What AI Did Well
- **Database design:** WAL mode, proper indexes, foreign keys with CASCADE delete — production-grade from the start
- **Auth architecture:** JWT with interceptors, token auto-injection on frontend, 401 redirect — complete auth flow in one pass
- **CSS design system:** Created a cohesive dark-mode theme with CSS variables, not a single Tailwind class — exactly what was needed
- **Edge case discovery:** Found 48 edge cases I never would have tested manually (UUID collisions, bcrypt DoS, corrupted localStorage)

---

## ⚖️ Tradeoffs

### What I Skipped (and Why)
| Skipped | Reason |
|---------|--------|
| **Deployment & Database Persistence** | Designed for split deployment (Vercel Frontend + Render Backend). Since SQLite is used, the free-tier Render backend has an ephemeral filesystem, meaning the database resets when the instance sleeps. For a production system, I would swap SQLite for PostgreSQL via an ORM, but for this assignment, the ephemeral SQLite is sufficient to demonstrate the architecture. |
| **Unit tests** | Tested via API calls and browser automation instead. Would add Jest + Supertest with more time. |
| **Input sanitization library** | Used manual `.trim()` and regex. Would add `express-validator` or `joi` for production. |
| **Rate limiting** | No API rate limiting. Would add `express-rate-limit` to prevent abuse. |
| **Password strength rules** | Minimum 4 characters only. Would add complexity requirements for production. |
| **Fancy UI** | Assignment says "don't spend time on fancy UI" — kept it clean but functional with a dark-mode design system. |

### What I'd Improve With More Time
1. **Add Jest tests** — Unit tests for each route, integration tests for order flows
2. **Deploy to Railway** — Add Dockerfile, environment config, production build
3. **Add role-based access** — Admin vs. Staff roles with different permissions
4. **Customer history** — View all orders for a specific customer by phone number
5. **Revenue trends** — Dashboard charts showing revenue over time (daily/weekly)
6. **SMS notifications** — Notify customers via Twilio when status changes
7. **Receipt generation** — PDF receipt download for each order
8. **Barcode/QR** — Print barcodes for physical order tracking
9. **Bulk status update** — Select multiple orders and update status at once

---