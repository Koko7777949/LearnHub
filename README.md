<div align="center">

# 🎓 LearnHub

### Online Courses Platform with Instructor Revenue Ledger

**Next.js 16 · React 19 · TypeScript · Prisma + SQLite · Tailwind CSS 4 · shadcn/ui · Recharts**

A full-stack course marketplace with a Stripe-style instructor revenue ledger, transparent 70/30 revenue split, payout workflow, and a complete admin panel — bilingual (English / 中文).

</div>

---

## ✨ Features

### 🛒 Marketplace (Public)
- Course catalog with search, category & level filters, sorting
- **Instant search suggestions** — Coursera-style type-ahead: results appear as you type with highlighted matches, ratings, prices and keyboard navigation (↑/↓/Enter)
- Course detail pages with syllabus accordion and sticky purchase card
- Instant checkout → transactional enrollment + revenue ledger entry
- **Shopping cart** — multi-course bulk checkout with persisted cart, order summary and coupon redemption
- **Coupon system** — storewide & course-scoped discount codes with usage caps, expiry dates and live validation
- **About & FAQ pages** — mission, story, values, milestones + grouped Q&A
- Professional multi-column footer + promo banner

### 💳 Payments
- **Stripe Checkout integration** — when `STRIPE_SECRET_KEY` is set (Vercel env vars or `.env`), the cart and buy-now buttons route through Stripe's hosted checkout page with per-course line items, coupon discounts applied server-side, and idempotent post-payment fulfillment (enrollment + 70/30 ledger rows) after redirect verification
- **Demo mode fallback** — without the key, checkout enrolls instantly with no payment, so the platform always works out of the box

### 🎬 Video Lessons
- **Real video playback** — every lesson carries a video URL rendered in an MP4/WebM `<video>` player with seek support, or a YouTube embed when a YouTube link is used
- **MP4 uploads** — instructors attach a real video file (≤ 4 MB, MP4/WebM/MOV) to each lesson in the course studio, or paste any `https://` video link; files are served through `/api/videos/<file>` with HTTP Range support
- **Seeded sample videos** — all 110 demo lessons ship with playable public-domain sample videos

### 🎓 Student
- "My Learning" dashboard with course progress cards
- Complete purchase history with prices and dates
- Course player, reviews, wishlist, certificates of completion

### 👨‍🏫 Instructor
- **Dashboard**: earnings stats, revenue area chart, per-course performance table
- **Coupon management** — create course-scoped promo codes with discount %, usage caps and expiry; track redemptions
- **Revenue Ledger** (4 tabs):
  - **Overview** — lifetime earnings, available balance, monthly revenue trend, 70/30 split donut
  - **Transactions** — filterable ledger (sales / refunds) with running balance
  - **Payouts** — request payouts with 25 / 50 / 100% quick presets + full history
  - **By Course** — per-course earnings with share bars
- **CSV export** — merged transactions + payouts with summary footer

### 🛡️ Admin
- Platform GMV, revenue, and enrollment analytics
- **Payout approval queue**: approve → mark as paid, or reject with reason
- **Coupon management** — create storewide or course-scoped coupons, activate/deactivate, view usage
- User and course management

### 🌐 Platform
- Full **EN / 中文** language toggle (≈290 i18n keys)
- Role-based SPA routing with auth guards
- Responsive: desktop dashboard + mobile drawer navigation
- **Demo coupons**: `WELCOME25` (storewide −25%) · `LEARN10` (storewide −10%) · `MLLAUNCH40` / `DESIGN15` (course-scoped) · `BLACKFRIDAY50` (expired, for testing)

## 📸 Screenshots

| Marketplace | Revenue Ledger |
|:---:|:---:|
| ![Marketplace](docs/screenshot-marketplace.png) | ![Revenue Ledger](docs/screenshot-revenue-ledger.png) |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install          # or: bun install

# 2. Configure environment
cp .env.example .env
#    → edit DATABASE_URL to point at your local project path

# 3. Set up the database
npx prisma generate
npx prisma db push       # create SQLite schema
npx prisma db seed       # seed demo data (or skip — see note below)

# 4. Run
npm run dev              # → http://localhost:3000
```

> **Note:** the repository ships with a pre-seeded `db/custom.db` (19 users, 10 courses, ~214 transactions across 6 months, 11 payouts). If you keep it, you can skip `db push` + `db seed` and run immediately — just fix the `DATABASE_URL` path in `.env`.

## 👤 Demo Accounts

All passwords: `demo123`

| Role | Email | Explore |
|------|-------|---------|
| Student | `liam@student.dev` | Marketplace, checkout, My Learning |
| Instructor | `sarah@learnhub.dev` | Revenue Ledger, payouts, CSV export |
| Admin | `admin@learnhub.dev` | Payout approvals, platform stats |

One-click demo login buttons are available on the sign-in page.

## 💳 Enabling Real Stripe Payments

The platform ships with a complete Stripe Checkout integration that activates the
moment a secret key exists:

1. Create a Stripe account → **Developers → API keys** → copy the **secret key** (`sk_test_...`)
2. Add it as an environment variable:
   - **Vercel**: Project → Settings → Environment Variables → `STRIPE_SECRET_KEY` → Redeploy
   - **Local**: put it in `.env`
3. The cart + buy-now buttons instantly switch to Stripe's hosted checkout page
   (line items per course, coupon discounts priced server-side), and enrollment +
   70/30 ledger entries are written only after Stripe confirms payment on redirect.

**Test card** (test mode): `4242 4242 4242 4242` · any future expiry · any CVC.

Without the key, everything still works in demo mode (instant free checkout).
Optional env vars: `STRIPE_MODE=live` (badge text) · `STRIPE_CURRENCY=eur` (default `usd`).

## 🌐 Custom Domain (e.g. learnhub.com)

1. Buy a domain (Namecheap / Cloudflare / GoDaddy…)
2. Vercel dashboard → your project → **Settings → Domains → Add** → enter the domain
   (or CLI: `vercel domains add learnhub.com` / `vercel alias set <url> learnhub.com`)
3. At your registrar, create the DNS records Vercel shows:
   - apex domain → `A 76.76.21.21`
   - subdomain (www) → `CNAME cname.vercel-dns.com`
4. Wait for the SSL certificate to issue (usually minutes) — the site then serves
   over HTTPS from your domain.

## 🧮 Revenue Ledger Logic

- **SALE** → instructor earns 70% of gross (`netEarnings`), platform keeps 30% (`platformFee`)
- **REFUND** → negative entry linked to the original sale via `relatedTransactionId`
- **Payouts** → deducted from available balance; `PENDING` and `APPROVED` both **reserve** funds until `PAID` / `REJECTED`
- Balance = lifetime net earnings − refunds − reserved & completed payouts

## 🗂 Project Structure

```
prisma/schema.prisma        # User · Course · Lesson(videoUrl) · Enrollment · Transaction · Payout · Coupon
prisma/seed.ts              # Deterministic seed (~214 txns, 6 months, sample lesson videos, coupons)
src/
├── app/page.tsx            # SPA entry — role-based view routing + Stripe redirect handler
├── app/api/                # REST routes: auth, courses, cart/checkout, coupons,
│                           # stripe/{config,checkout,verify}, videos/{upload,[file]},
│                           # learning, ledger, payouts, admin stats, CSV export
├── components/platform/    # marketplace, course detail + player, dashboards,
│                           # revenue-ledger, search-autocomplete, studio, app shell
├── lib/enroll.ts           # shared pricing + enrollment engine (demo & Stripe rails)
├── lib/ledger.ts           # computeLedger(): balance, monthly buckets, per-course
├── lib/i18n.tsx            # EN/中文 dictionaries + LanguageProvider
├── lib/format.ts           # money/date formatting helpers
└── store/app.ts            # Zustand: user · language · view · cart · checkout intent
```

## 🛠 Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Database | Prisma ORM + SQLite |
| Payments | Stripe Checkout (optional, activates with STRIPE_SECRET_KEY) |
| UI | Tailwind CSS 4 · shadcn/ui · lucide-react icons · sonner toasts |
| Charts | Recharts (area · donut · bar) |
| State | Zustand + persist |

## 📄 License

MIT — use it freely for learning and portfolio projects.
