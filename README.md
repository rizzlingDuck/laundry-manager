# 🧺 LaundryPro — Mini Laundry Order Management System

A full-stack laundry/dry cleaning order management system built with **Node.js**, **React**, and **SQLite** — built AI-first in under 3 hours.

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+
- **npm** v9+

### 1. Clone & Start Backend
```bash
cd server
npm install
node src/index.js
```
API runs on **http://localhost:3001**

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
```
App opens on **http://localhost:3000**

### 3. Use It
1. Open **http://localhost:3000**
2. **Register** a new account (any username/password)
3. Start creating orders!

### 4. Postman (Optional)
Import `postman_collection.json` from the root directory.  
Run **Login** first → token auto-saves → all other requests work.

---

## ✅ Features Implemented

### Core Features (All Working)
| Feature | Status | Details |
|---------|--------|---------|
| Create Order | ✅ | Customer name, phone, garment picker, quantity, auto-pricing |
| Unique Order ID | ✅ | `ORD-XXXXXXXX` format with collision retry |
| Total Bill Calculation | ✅ | Real-time calculation, floating-point precision handling |
| Order Status Management | ✅ | RECEIVED → PROCESSING → READY → DELIVERED |
| Status Transition Rules | ✅ | Forward-only, no skipping (RECEIVED can't jump to READY) |
| View All Orders | ✅ | Paginated list, 20 per page |
| Filter by Status | ✅ | One-click filter buttons |
| Filter by Name / Phone | ✅ | Auto-detects digits vs text |
| Dashboard | ✅ | Total orders, revenue, status breakdown, top garments, recent orders |

### Bonus Features (All Working)
| Feature | Status | Details |
|---------|--------|---------|
| React Frontend | ✅ | Full SPA with dark-mode design system |
| JWT Authentication | ✅ | Register/login, token-protected routes |
| SQLite Database | ✅ | Persistent storage with WAL mode, indexes, foreign keys |
| Search by Garment Type | ✅ | Filter orders containing specific garments |
| Estimated Delivery Date | ✅ | Auto-calculated from garment processing times |
| Postman Collection | ✅ | 20 requests including edge case tests |

### Edge Case Handling (48 cases)
| Category | Examples |
|----------|----------|
| Input Validation | Whitespace-only names, negative quantities, non-numeric pagination |
| Security | Bcrypt DoS protection (72-char max), JSON body size limit (1MB) |
| Data Integrity | UUID collision retry, transaction-safe deletes, float precision rounding |
| UX Protection | Double-submit prevention, phone input digit-only restriction |

---

## 🤖 AI Usage Report

### Tools Used
| Tool | Purpose |
|------|---------|
| **Antigravity (Google DeepMind)** | Primary coding assistant — architecture, scaffolding, full implementation |

### Prompts I Used

#### Prompt 1 — Initial Scaffold
> *"Build a Mini Laundry Order Management System... read everything, do everything they ask for, impress them"*

**What AI did:** Chose Express + SQLite + React stack, designed the DB schema with indexes, created the entire project structure (8 backend files, 8 frontend files) in ~8 minutes.

**What I had to guide:** I had to approve the tech stack choice. AI initially offered a plan and waited for my approval — the plan was solid so I said "sure go ahead."

#### Prompt 2 — Edge Case Audit
> *"Find out all the edge cases and solve them all"*

**What AI did:** Systematically read every file (routes, middleware, DB schema, all React pages, CSS), identified 48 edge cases across 8 files, and implemented fixes with test verification.

**What was impressive:** AI caught security issues I wouldn't have thought of — like bcrypt accepting strings of unlimited length (DoS vector) and UUID collision potential from `slice(0, 8)`.

#### Prompt 3 — Evaluation Optimization
> *"Look at the initial prompt... find out which things will increase my chances and improve them"*

**What AI did:** Cross-referenced the assignment rubric against the current deliverables, identified the Postman collection was missing (explicitly listed as a deliverable), and flagged the AI Usage Report as too thin.

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
| **Deployment** | Focused time on code quality, edge cases, and documentation instead. Would deploy to Railway (SQLite-compatible) with more time. |
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

## 📁 Project Structure

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
│   └── package.json
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx      # Sidebar layout
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx    # Login/Register
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── OrdersPage.jsx  # Orders list + filters
│   │   │   ├── CreateOrderPage.jsx
│   │   │   └── OrderDetailPage.jsx
│   │   ├── api.js              # Axios + JWT interceptors
│   │   ├── App.jsx             # Router + auth guard
│   │   └── index.css           # Design system
│   └── package.json
├── postman_collection.json     # API collection (20 requests)
├── .gitignore
└── README.md
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{ username, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ username, password }` | `{ token, user }` |

### Orders (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders (with filters) |
| GET | `/api/orders/:id` | Get single order |
| PATCH | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Delete order (RECEIVED only) |

### Dashboard (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | All dashboard stats |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/pricing` | Garment pricing |

#### Filter Parameters for `GET /api/orders`
```
?status=RECEIVED          # Filter by status
?customer=Rahul           # Search by name (partial match)
?phone=9876               # Search by phone (partial match)
?garment=Saree            # Filter by garment type
?page=1&limit=20          # Pagination
```

#### Create Order Body
```json
{
  "customerName": "Rahul Sharma",
  "phone": "9876543210",
  "items": [
    { "garmentType": "Shirt", "quantity": 3 },
    { "garmentType": "Pants", "quantity": 2 }
  ]
}
```

---

## 🏗️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Node.js + Express | Fast to scaffold, widely understood |
| Database | SQLite (better-sqlite3) | Zero config, file-based, production-capable |
| Auth | JWT + bcryptjs | Stateless auth, secure password hashing |
| Frontend | React 19 + Vite | Fast dev server, modern tooling |
| HTTP Client | Axios | Interceptors for auto-token injection |
| Styling | Vanilla CSS | No build complexity, full control |

---

## 📄 License

MIT
