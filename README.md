# FactoryFlow 🏭

### Smart Factory Management SaaS — Orders, Production, Invoicing & AI Insights

> A full-stack production-ready SaaS platform built for Indian manufacturing factories to manage their entire business — from customer onboarding to GST invoicing, production tracking, payment collection, and AI-powered business insights powered by **Google Gemini**.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white)](https://mui.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Integrated-8B5CF6?logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Features

### 📊 Dashboard & Analytics

- Personalized greeting with real-time KPI cards (revenue, orders, production, outstanding)
- Company performance bar charts & customer revenue pie charts
- Getting started wizard for new users with empty state guidance

### 🤖 AI-Powered Insights (Gemini)

- Google Gemini AI integration for intelligent business analysis
- AI-generated actionable recommendations based on factory metrics
- Performance radar chart (Revenue, Quality, Delivery, Collection scores)
- Revenue projections, capacity utilization analysis, and aging invoice alerts
- Rule-based fallback when AI is unavailable

### 👥 Customer Management

- Full CRUD with search, pagination, and outstanding balance tracking
- Excel/CSV import for bulk customer migration from legacy systems
- Template download for standardized data import
- Export customer data to Excel

### 📦 Order Management

- Create orders with priority levels (Low, Normal, High, Urgent)
- Order lifecycle tracking: Pending → Confirmed → In Production → Quality Check → Delivered
- Order-to-invoice conversion with automatic calculations
- Filterable order list with status chips and priority indicators

### �icing Production Tracking

- Daily production log entries with units produced, defective count, and shift tracking
- Quality rate monitoring with defect analysis
- Shift-wise production comparison (Day/Night/General)
- 30-day rolling production analytics

### 🧾 GST-Compliant Invoicing

- Professional PDF invoice generation with jsPDF (auto-download)
- CGST/SGST/IGST tax calculations based on customer state
- HSN/SAC code support, amount in words (Indian numbering system)
- Invoice aging analysis (Current, 30-day, 60-day, 90+ day overdue)
- Configurable factory details, bank info, and GSTIN from settings

### 💰 Payment Management

- Record payments against invoices with multiple modes (Cash, UPI, Bank Transfer, Cheque, NEFT, RTGS)
- Auto-update invoice status (Unpaid → Partial → Paid)
- Payment history per invoice with running balance
- Collection rate tracking and payment mode distribution charts

### 🔐 Authentication & Security

- JWT-based authentication with 7-day token expiry
- Bcrypt password hashing (12 salt rounds)
- Helmet security headers, CORS, HPP protection
- Rate limiting (100 req/15min) to prevent abuse
- Protected routes with auth middleware

### ⚙️ Settings & Configuration

- Update profile (name, email)
- Change password with current password verification
- Factory info configuration (name, address, GSTIN, phone, bank details)
- Settings persist across sessions via localStorage

---

## 🛠️ Tech Stack

| Layer             | Technology                                                     |
| ----------------- | -------------------------------------------------------------- |
| **Frontend**      | React 19, Material UI (MUI) 7, React Router 7, Recharts, jsPDF |
| **Backend**       | Express 5, Node.js, JWT Auth, express-validator                |
| **Database**      | PostgreSQL 17 (raw SQL with pg driver)                         |
| **AI**            | Google Gemini 2.0 Flash via @google/generative-ai              |
| **PDF**           | jsPDF + jspdf-autotable (GST invoice generation)               |
| **Import/Export** | ExcelJS (Excel/CSV import & export)                            |
| **Security**      | Helmet, CORS, rate-limiting, HPP, bcryptjs                     |
| **Logging**       | Winston (structured JSON in prod, colorized in dev)            |
| **DevOps**        | Docker, docker-compose, PM2, multi-stage build                 |

---

## 📁 Project Structure

```
factoryflow/
├── public/                     # Static assets & index.html
├── src/                        # React frontend
│   ├── components/             # Layout (Sidebar, Header), Landing page sections
│   │   ├── Layout/             # AppLayout, Sidebar, Header
│   │   ├── Navbar/             # Landing page navbar
│   │   └── ...                 # Hero, Features, Pricing, etc.
│   ├── pages/                  # Application pages
│   │   ├── Auth/               # Login, Register
│   │   ├── Dashboard/          # Main dashboard with KPIs & charts
│   │   ├── Customers/          # List, Form, Detail, Import
│   │   ├── Orders/             # List, Create, Detail
│   │   ├── Production/         # Overview, Log Form
│   │   ├── Invoices/           # List, Create, Detail (PDF)
│   │   ├── Payments/           # Form, List
│   │   ├── Insights/           # AI Insights (Gemini-powered)
│   │   └── Settings/           # Profile, Factory config
│   ├── services/               # API client (Axios-like fetch wrapper)
│   ├── utils/                  # Formatters, PDF generator
│   ├── contexts/               # AuthContext (JWT management)
│   └── routes/                 # Route definitions, ProtectedRoute
├── server/                     # Express backend
│   ├── config/                 # DB connection, logger, env validation
│   ├── db/                     # Migration & seed scripts
│   ├── middleware/             # Auth, error handler, rate limiter
│   ├── routes/                 # API routes (auth, customers, orders, etc.)
│   └── jobs/                   # Cron jobs (payment reminders)
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Multi-stage production build
└── ecosystem.config.js         # PM2 process management
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 17
- Google Gemini API Key (optional, for AI features)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/factoryflow.git
cd factoryflow

# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
PORT=5001
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=factoryflow
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Google Gemini AI (optional)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Setup Database

```bash
cd server
node db/migrate.js    # Create tables
node db/seed.js       # (Optional) Load demo data
```

### 4. Run

```bash
# Terminal 1 — Backend
cd server && node index.js

# Terminal 2 — Frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000)

**Demo Login:** `demo@factoryflow.com` / `password123`

---

## 🐳 Docker Deployment

```bash
docker-compose up -d --build
```

---

## 📸 Screenshots

| Dashboard                                 | AI Insights                          | Invoice PDF                    |
| ----------------------------------------- | ------------------------------------ | ------------------------------ |
| KPI cards, charts, getting started wizard | Gemini-powered analysis, radar chart | GST-compliant professional PDF |

---

## 🗺️ API Endpoints

| Method   | Endpoint               | Description                  |
| -------- | ---------------------- | ---------------------------- |
| POST     | `/api/auth/register`   | Register new user            |
| POST     | `/api/auth/login`      | Login & get JWT              |
| GET      | `/api/dashboard/stats` | Dashboard KPIs               |
| GET      | `/api/insights`        | AI-powered insights (Gemini) |
| CRUD     | `/api/customers`       | Customer management          |
| CRUD     | `/api/orders`          | Order management             |
| CRUD     | `/api/invoices`        | Invoice management           |
| CRUD     | `/api/payments`        | Payment management           |
| GET/POST | `/api/production`      | Production logs              |
| GET      | `/api/export/:type`    | Excel export                 |
| GET/POST | `/api/import/*`        | Excel/CSV import             |

---

## 📄 License

MIT © FactoryFlow
