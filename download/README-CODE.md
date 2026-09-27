# LearnHub — Online Courses Platform with Instructor Revenue Ledger

A full-stack course marketplace with a Stripe-style instructor revenue ledger (70/30 revenue split).

## Tech Stack
- **Next.js 16** (App Router) + React 19 + TypeScript
- **Prisma + SQLite** (file: `db/custom.db`, seeded with ~214 transactions over 6 months)
- **Tailwind CSS 4 + shadcn/ui** components
- **Recharts** for revenue analytics charts
- **Zustand** for SPA view routing / language state

## Quick Start

```bash
# 1. Install dependencies
npm install        # or: bun install

# 2. Set up the database
npx prisma generate
npx prisma db push          # creates SQLite schema
npx prisma db seed          # seeds users, courses, transactions, payouts
# (seed script is configured in package.json → prisma.seed)

# 3. Run the dev server
npm run dev        # http://localhost:3000
```

> Note: `prisma/seed.ts` expects `DATABASE_URL` in `.env` → `DATABASE_URL="file:/absolute/path/to/db/custom.db"`
> Adjust the path after extracting, or simply run `npx prisma db push && npx prisma db seed` with your own `.env`.

## Demo Accounts (password for all: `demo123`)

| Role | Email |
|------|-------|
| Student | `liam@student.dev` |
| Instructor (owns Revenue Ledger) | `sarah@learnhub.dev` |
| Admin (approves payouts) | `admin@learnhub.dev` |

## Project Structure

```
prisma/schema.prisma          # User, Course, Lesson, Enrollment, Transaction, Payout
prisma/seed.ts                # Deterministic seed: 19 users, 10 courses, ~214 txns, 11 payouts
src/
├── app/
│   ├── page.tsx              # SPA entry — role-based view routing
│   └── api/
│       ├── auth/login        # POST login (demo: plaintext compare)
│       ├── courses           # GET list + filters (search/category/level/sort)
│       ├── courses/[id]      # GET course detail with lessons + instructor
│       ├── enrollments       # GET student data / POST purchase (tx: enrollment + SALE txn)
│       ├── ledger            # GET summary + transactions (instructorId)
│       ├── payouts           # GET list / POST request payout (server-side balance check)
│       ├── payouts/[id]      # PATCH state machine: PENDING→APPROVED/REJECTED, APPROVED→PAID
│       ├── admin/stats       # GMV, platform revenue, category & monthly aggregates
│       ├── admin/users       # All users for admin panel
│       └── export            # GET CSV export (transactions + payouts merged)
├── components/platform/
│   ├── auth-view.tsx         # Login page + one-click demo login
│   ├── app-shell.tsx         # Top header + dark dashboard sidebar + language toggle
│   ├── marketplace.tsx       # Hero, category filters, course grid
│   ├── course-detail.tsx     # Syllabus accordion + sticky purchase card
│   ├── student-dashboard.tsx # Progress cards + purchase history
│   ├── instructor-dashboard  # Stats cards + revenue area chart + course table
│   ├── revenue-ledger.tsx    # 4 tabs: Overview / Transactions / Payouts / By-Course
│   ├── admin-panel.tsx       # Overview + payout approval queue + users + courses
│   └── ui-bits.tsx           # Avatar, CourseCover, StatCard, badges…
├── lib/
│   ├── ledger.ts             # computeLedger(): lifetime earnings, balance, monthly buckets
│   ├── i18n.tsx              # EN/中文 dictionaries (~200 keys) + LanguageProvider
│   ├── format.ts             # fmtMoney / fmtDate / fmtMonth helpers
│   └── types.ts              # Shared TypeScript interfaces
└── store/app.ts              # Zustand: user / lang / view / checkout intent
```

## Revenue Ledger Logic
- **SALE** transactions add `netEarnings` (70%) to the instructor balance
- **REFUND** transactions subtract (negative entry linked to original sale)
- **Payouts** deduct from available balance: PENDING / APPROVED both reserve funds, PAID is final
- CSV export merges transactions + payouts chronologically with a summary footer

## Languages
Full bilingual support (English / 中文) via the toggle in the top header.
