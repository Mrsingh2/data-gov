# DataGov — Controlled Data Exchange Platform

A production-style, full-stack data exchange platform with tiered access control, secure statistical previews, dataset versioning, download tracking, and full audit logging.

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | Deployed on Vercel |
| Backend | Deploy `backend/` to Vercel (separate project) or Railway |

**Demo Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@datagov.io | Admin123! |
| Owner (Publisher) | owner@datagov.io | Owner123! |
| Registered User | user@datagov.io | User1234! |

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js Frontend                │
│  (App Router · Tailwind CSS · Deployed: Vercel) │
└──────────────────────┬──────────────────────────┘
                       │ REST API calls (/api/*)
┌──────────────────────▼──────────────────────────┐
│                  NestJS Backend                  │
│  (Modular · JWT Auth · Deployed: Vercel/Railway) │
└──────────────────────┬──────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────┐
│         PostgreSQL Database (Neon/Supabase)      │
└─────────────────────────────────────────────────┘
```

### Key Design Principles
- **All security enforced server-side** — frontend is display-only; backend guards all data
- **Zero raw leakage** — restricted column values never appear in any API response
- **Row-level access** pre-computed at upload time (stored as `isRestricted` boolean)
- **Column protection** transforms applied at download/preview time

---

## Role Definitions

| Role | Capabilities |
|------|-------------|
| **Guest** (unauthenticated) | Browse public datasets, view column statistics |
| **Registered** | Guest + download OPEN/REGISTERED datasets, request RESTRICTED access, download history |
| **Owner** | Registered + create/edit datasets, upload CSV versions, define protection rules, review access requests |
| **Admin** | All capabilities + view platform audit log |

> A user becomes OWNER automatically upon creating their first dataset.

---

## Core Features

### 1. Authentication & Roles
- Email + password login with JWT tokens (7-day expiry)
- Role-based access enforced via NestJS `RolesGuard`
- Passwords hashed with bcrypt (cost 12)

### 2. Dataset Model
- **Title, Description, Tags** — discoverable metadata
- **Visibility** — `PUBLIC` (in discovery + KPIs) or `PRIVATE`
- **Access Classification** — `OPEN`, `REGISTERED`, or `RESTRICTED`

### 3. Multi-Level Access Control

**Dataset-level:** OPEN / REGISTERED / RESTRICTED controls who can download.

**Row-level:** Owners define `RowProtectionRule` (field + operator + value). At CSV upload time, matching rows are stored with `isRestricted = true`. Download API applies `WHERE isRestricted = false` for unauthorized users.

**Column-level:** Owners define `ColumnProtectionRule` with one of three strategies:
- `MASK` → replace value with `null`
- `ANONYMIZE` → deterministic HMAC-SHA256 pseudonym
- `SYNTHETIC` → Gaussian noise (numeric) or frequency-weighted sampling (categorical)

### 4. Secure Preview (No Raw Data Leakage)
`GET /api/datasets/:id/preview` computes column aggregates (null count, unique count, min/max/mean/stdDev, top value frequencies) **server-side from raw data** and returns **only the aggregates**. Protected columns without access show only null counts.

### 5. Access Request Workflow
User submits request → Owner reviews → APPROVED (creates AccessGrant) or REJECTED.

### 6. Dataset Versioning
- **Metadata versions** — every metadata edit creates a new `MetadataVersion`
- **Data versions** — every CSV upload creates a new `DataVersion` + `DataRow` records

### 7. Download Tracking
Every download creates a `Download` record (user, dataset, version, timestamp, IP).

### 8. Platform KPIs
Aggregates total datasets, views, downloads, users — **PUBLIC datasets only**.

### 9. Search & Discovery
Full-text search on title/description/tags, filter by access type/visibility/owner.

### 10. Audit Logging
Every action logged: user, action, dataset, IP, timestamp. Admin-only viewer.

---

## Local Development Setup

### Prerequisites
- Node.js 18+, npm
- PostgreSQL 15+ (or Neon/Supabase connection string)

### 1. Clone & Install

```bash
git clone https://github.com/mrsingh2/data-gov.git
cd data-gov

# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and JWT_SECRET

# Frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Set Up Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
cd ..
```

### 4. Start Both Servers

```bash
# Terminal 1: Backend (port 3001)
cd backend && npm run start:dev

# Terminal 2: Frontend (port 3000)
npm run dev
```

Open http://localhost:3000

---

## Deployment

### Frontend (Vercel)
1. Import repo in Vercel, set **Root Directory** to `/`
2. Framework: **Next.js**
3. Env var: `NEXT_PUBLIC_API_URL` = your backend URL

### Backend (Vercel — separate project)
1. Import same repo, set **Root Directory** to `backend/`
2. Env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `ANONYMIZE_SALT`, `BLOB_READ_WRITE_TOKEN`

### Backend (Railway — alternative)
Connect Railway to `backend/` directory, add the same env vars.

### Database (Neon — recommended)
1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string to `DATABASE_URL`
3. Run: `cd backend && npm run prisma:migrate && npm run prisma:seed`

---

## API Reference

### Auth
| POST `/api/auth/register` | POST `/api/auth/login` | GET `/api/auth/me` |

### Datasets
| GET `/api/datasets` | POST `/api/datasets` | GET `/api/datasets/:id` | PATCH `/api/datasets/:id` | DELETE `/api/datasets/:id` | GET `/api/datasets/mine` |

### Upload & Versions
| POST `/api/upload/csv/:datasetId` | GET `/api/datasets/:id/versions/metadata` | GET `/api/datasets/:id/versions/data` |

### Preview & Download
| GET `/api/datasets/:id/preview` (no raw values) | GET `/api/datasets/:id/preview/sample` | GET `/api/datasets/:id/download` | GET `/api/datasets/:id/download?versionId=X` |

### Access Control
| POST `/api/access/request` | GET `/api/access/pending` | GET `/api/access/mine` | PATCH `/api/access/request/:id/review` |

### Protection Rules
| CRUD `/api/datasets/:id/protection/columns` | CRUD `/api/datasets/:id/protection/rows` |

### Platform
| GET `/api/kpi` | GET `/api/audit` (admin) | GET `/api/users/me/downloads` |

---

## Security Design

1. **Backend-only enforcement** — All authorization in NestJS, frontend is UI only
2. **Global JWT guard** — Every protected endpoint validates token + user existence
3. **Input validation** — `ValidationPipe(whitelist: true)` strips unknown fields
4. **Password hashing** — bcrypt cost 12
5. **Non-blocking audit** — Log failures never break main request flow
6. **No raw data leakage** — Preview aggregates computed server-side, row arrays never serialized

---

## Project Structure

```
data-gov/
├── src/                     # Next.js 14 frontend
│   ├── app/                 # App Router pages
│   ├── components/          # UI components
│   ├── context/AuthContext.tsx
│   ├── lib/api.ts           # Axios API client
│   └── types/api.ts         # TypeScript interfaces
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/            # JWT, bcrypt, Passport
│   │   ├── datasets/        # CRUD, search
│   │   ├── upload/          # CSV parsing, storage
│   │   ├── protection/      # MASK/ANONYMIZE/SYNTHETIC
│   │   ├── preview/         # Secure column stats
│   │   ├── access/          # Request workflow
│   │   ├── downloads/       # Filtered download + tracking
│   │   ├── audit/           # Structured audit log
│   │   ├── kpi/             # Platform aggregates
│   │   └── common/          # Guards, decorators, filters
│   ├── prisma/
│   │   ├── schema.prisma    # Full DB schema
│   │   └── seed.ts          # Demo data (3 users, 3 datasets)
│   └── api/index.ts         # Vercel serverless entry
├── vercel.json              # Frontend deployment config
└── README.md
```
