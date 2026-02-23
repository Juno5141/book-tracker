# 📚 Book Tracker — Mini Library Management

A full-stack library management web app built with **Next.js 14**, **PostgreSQL**, **Prisma**, and **NextAuth.js**. Features AI-powered metadata enrichment, role-based access control, and a borrow request workflow.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)

## ✨ Features

### Core
- **Book CRUD** — Add, edit, delete books with rich metadata (title, author, genre, tags, description, ISBN, cover URL, reading difficulty)
- **Search & Filter** — Real-time search by title/author/ISBN, filter by genre, status, and tags
- **Borrow Request Workflow** — Members request → Librarians approve/deny → Automatic checkout creation
- **Check-in/Check-out** — Track who has what book, with due dates and return processing
- **Overdue Dashboard** — See all overdue books, days overdue, and quick return processing
- **Audit Log** — Complete history of all actions (creates, borrows, returns, role changes)

### AI Features
- **AI Metadata Enrichment** — One-click AI generation of synopsis, tags, genre, and reading difficulty using OpenAI GPT-4o-mini

### Authentication & RBAC
- **Google OAuth SSO** via NextAuth.js
- **Three roles**: ADMIN, LIBRARIAN, MEMBER
- **Server-side role enforcement** on all API routes
- **Auto-admin assignment** via ADMIN_EMAIL environment variable

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | NextAuth.js v4 + Google OAuth |
| AI | OpenAI GPT-4o-mini |
| Styling | TailwindCSS |
| Deployment | Vercel (web) + Neon (DB) |

## 📋 Prerequisites

- Node.js 18+ 
- A PostgreSQL database (recommend [Neon](https://neon.tech) — free tier)
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- OpenAI API key (for AI features — optional)

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd book-tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (Neon PostgreSQL connection string)
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Admin: this email auto-becomes ADMIN on first sign-in
ADMIN_EMAIL="your-admin@gmail.com"

# OpenAI (optional, for AI enrichment)
OPENAI_API_KEY="sk-..."
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set **Authorized redirect URIs** to:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://your-domain.vercel.app/api/auth/callback/google` (production)
4. Copy Client ID and Secret to `.env`

### 4. Database Migration & Seed

```bash
# Push schema to database
npx prisma db push

# (Optional) Seed with sample books
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 👥 Roles & Permissions

| Permission | MEMBER | LIBRARIAN | ADMIN |
|-----------|--------|-----------|-------|
| Browse & search books | ✅ | ✅ | ✅ |
| View book details | ✅ | ✅ | ✅ |
| Request to borrow | ✅ | ✅ | ✅ |
| View personal checkouts | ✅ | ✅ | ✅ |
| Add/edit books | ❌ | ✅ | ✅ |
| AI enrich metadata | ❌ | ✅ | ✅ |
| Approve/deny requests | ❌ | ✅ | ✅ |
| Process returns | ❌ | ✅ | ✅ |
| View overdue dashboard | ❌ | ✅ | ✅ |
| View audit log | ❌ | ✅ | ✅ |
| Delete books | ❌ | ❌ | ✅ |
| Manage user roles | ❌ | ❌ | ✅ |

### Creating Admin / Librarian Users

**Option A: Auto-admin (recommended)**
Set `ADMIN_EMAIL=your@email.com` in `.env`. When that Google account signs in, it automatically becomes ADMIN.

**Option B: Manual promotion via Admin Panel**
1. Sign in with the admin account (the one matching `ADMIN_EMAIL`)
2. Go to **Admin → Users** (`/admin/users`)
3. Use the role dropdown next to any user to promote them to LIBRARIAN or ADMIN
4. Changes take effect immediately — no sign-out/sign-in required for the target user

**Option C: Direct database**
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

> **📌 Note for reviewers:** The `ADMIN_EMAIL` environment variable is configured in the **Vercel deployment settings** (Settings → Environment Variables). To change which account is auto-promoted to admin, update the `ADMIN_EMAIL` value in Vercel and redeploy. Any existing admin can also promote additional users to ADMIN or LIBRARIAN directly from the `/admin/users` page without changing environment variables.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  — NextAuth handler
│   │   ├── books/               — Book CRUD + AI enrich
│   │   ├── requests/            — Borrow request workflow
│   │   ├── checkouts/           — Checkout & return
│   │   ├── users/               — User management (admin)
│   │   ├── dashboard/           — Overdue data
│   │   └── audit/               — Audit log
│   ├── books/                   — Book pages (list, detail, add, edit)
│   ├── requests/                — Borrow requests page
│   ├── dashboard/               — Overdue dashboard
│   ├── my-books/                — Personal reading tracker
│   ├── admin/users/             — User management
│   ├── audit/                   — Audit log viewer
│   └── auth/signin/             — Sign-in page
├── components/
│   ├── navbar.tsx               — Main navigation
│   └── ui/                      — Reusable UI components
├── lib/
│   ├── prisma.ts                — Prisma client singleton
│   ├── auth.ts                  — NextAuth configuration
│   ├── rbac.ts                  — Role-based access helpers
│   └── utils.ts                 — Utility functions
└── types/
    └── next-auth.d.ts           — Session type extensions
```

## 🔐 Security

- All API routes enforce authentication via `getSession()`
- Role checks are server-side via `requireRole()` helpers
- OpenAI API key is never exposed to the client
- Database credentials are server-side only
- CSRF protection via NextAuth

## 🚀 Deployment

### Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables from `.env`
4. Update `NEXTAUTH_URL` to your Vercel domain
5. Add Vercel domain to Google OAuth redirect URIs
6. Deploy!

### Database (Neon)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`
3. Run `npx prisma db push` to create tables
4. Run `npm run db:seed` to add sample data

## 📝 License

MIT
