# Vowly

Vowly is a multi-tenant SaaS for wedding websites, aimed mainly at Nigeria. Couples sign up, build a wedding website for their guests (RSVPs, gift registry, cash gifts, their story, a photo gallery, wishes) and can upgrade to a paid plan for more features.

## Stack

- **Next.js 16** (App Router), React 19, Tailwind CSS v4, TypeScript. Request routing lives in `proxy.ts`, which this Next.js version uses instead of `middleware.ts`.
- **Prisma 7 + Postgres** (Neon) through the `pg` adapter.
- **Custom auth**: argon2 password hashes, JWT sessions (`jose`) with a 30-minute sliding idle timeout, password-reset tokens, rate-limited login attempts.
- **Paystack** takes plan payments in NGN, with a signed webhook at `app/api/paystack/webhook/route.ts`.
- **AWS S3** stores media, uploaded through presigned URLs. HEIC photos are converted and images are compressed in the browser first.
- **Resend** sends transactional email.
- **Vitest** runs the unit tests (`lib/*.test.ts`).

## App areas

| Area | Routes | Purpose |
|---|---|---|
| Marketing | `/`, `/pricing`, `/terms`, `/privacy` | Landing page, theme showcase, plan pricing |
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password` | Account flows |
| Couple dashboard | `/dashboard`, `/dashboard/new`, `/dashboard/[weddingId]`, `/dashboard/[weddingId]/billing` | Tabs for the registry, contributions, RSVPs (with CSV/Excel import), wishes, media, story and story beats, design (theme and layout), wording, members, settings and billing |
| Guest site | `/w/[slug]`, `/w/[slug]/gallery`, `/w/[slug]/wishes` | The public wedding page: hero with countdown, how-we-met story, gallery with guest uploads, registry, cash gifts by bank transfer, asoebi, RSVP, love notes and wishes |
| Staff console | `/super/*` | Internal admin for weddings, users, payments, plans, staff, support notes, custom domains, comp plans and impersonation |

## Key concepts

- **Plans** (`lib/plans.ts`): each plan sets guest and upload limits, which themes are allowed, how many months the site stays online after the wedding date, and feature flags (gallery, video, custom theme, remove branding, custom credit, custom domain, priority support). `prisma/plan-catalog.ts` only seeds a fresh database. After that, plans are edited in the staff console at `/super/plans`.
- **Custom domains**: `proxy.ts` maps a couple's own domain to their `/w/[slug]` site and caches the lookup briefly.
- **Geo-restriction** (`lib/geo.ts`): a wedding can limit its site to certain countries. Guests abroad unlock it with an `?access=CODE` link, which is stored in a cookie.
- **Tenant isolation**: `lib/tenant-scope.ts` and `lib/db-scoped.ts` scope database queries to a single wedding.
- **Roles**: platform roles are `USER`, `VIEWER`, `SUPPORT`, `ADMIN` and `SUPER_ADMIN`; per-wedding roles are `OWNER` and `EDITOR`. Sensitive actions are written to an audit log.
- **Wedding lifecycle**: `DRAFT` → `ACTIVE` → `SUSPENDED` / `ARCHIVED`. Drafts can preview any theme.
- **Nigeria-specific**: amounts are stored in kobo, there's a Nigerian public holidays helper, cash gifts go to the couple's bank account and the couple confirms each one, and there's an asoebi section.

## Project layout

```
app/          Routes: (marketing), (auth), dashboard, super, w/[slug], api
components/   UI by area: admin, guest, super, marketing, auth
lib/          Business logic, mostly pure functions with tests
lib/actions/  Server actions, one file per area (registry, rsvp, billing, super, ...)
prisma/       Schema, migrations, seed and plan catalog
scripts/      CLI helpers
proxy.ts      Custom domains, auth redirect, geo-bypass cookie, session refresh
```

## Getting started

Create a `.env` file with these variables:

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Signing session JWTs |
| `SITE_URL` | The platform's own URL, used to tell it apart from custom domains |
| `PAYSTACK_SECRET_KEY` | Plan payments and webhook verification |
| `PAYSTACK_API_BASE` | Optional. Points Paystack calls at a mock during tests |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` | Media storage |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sending email |

Then install dependencies (this also runs `prisma generate`), apply the migrations and start the dev server:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

> The migrate, seed and script commands below write to whatever database `DATABASE_URL` points at. Check it before you run them.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm test` | Run the Vitest unit tests |
| `npm run lint` | Run ESLint |
| `npx prisma db seed` | Seed a fresh database with plans and a sample wedding |
| `npm run plans:load` | One-time switch to the current plan line-up from `prisma/plan-catalog.ts` |
| `npm run invite-user -- <email> [--wedding <slug> --role OWNER\|EDITOR] [--super-admin]` | Create an account and send it a set-password link |
