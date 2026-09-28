# Runbook: move Oluwatayo & Ayomide (ayodimeji.online) onto Vowly

**Status:** planned, not started. Schedule a window when developers and testers are all available.
**Written:** 28 September 2026. Recheck every "current state" fact below before starting; things may have moved on.

## Summary

`ayodimeji.online` runs the old single-wedding app from `main`, on its **own database** (not the one the Vowly branches use in development). We upgrade that database in place with the Vowly migrations, which adopt its data as the first Vowly wedding (`wedding_legacy`). That database then becomes Vowly's production database. Their domain stays attached to the same Vercel project throughout; Vowly serves their site on it as a custom domain.

- Guests keep using `ayodimeji.online`, `/gallery` and `/wishes`. All RSVPs, registry items, wishes and bank details are kept.
- The couple stop using `/admin` and the shared `ADMIN_PASSWORD`. They get their own accounts and manage the wedding from the Vowly dashboard on Vowly's address.
- Rollback = restore the database from a Neon backup branch + Vercel Instant Rollback (see [Rollback](#rollback)).

## Current state (as of 28 Sept 2026)

| | |
|---|---|
| Live site | `https://ayodimeji.online` on Vercel, deployed from `main` (`a4a5823`) |
| Live database | Separate Neon database, old single-wedding schema, changed with `prisma db push` (only 2 migrations recorded) |
| Vowly code | `tenants-v1` (includes `payment-resolution`, PR #7). Also to merge: `server-pagination`, `zone-restrictions` |
| Wedding after migration | id `wedding_legacy`, slug from the couple's first names (in a copy: `oluwatayo-and-ayomide`), plan `legacy` (comped), status ACTIVE |
| Wedding date | 28 Nov 2026 |

## Known issues to fix before the window

These are code or data changes to make and test on a branch **before** the scheduled day.

1. **Their site would change colour.** The adopted wedding has no saved theme, so it uses the default preset. Terracotta & Olive (their original palette) was commented out of `lib/themes.ts`, so the default is now Blush & Rose. Fix: restore Terracotta & Olive as a preset (it can be hidden from pickers), or give `wedding_legacy` a theme row with their original colours. Also fixes the 2 failing tests in `lib/themes.test.ts`.
2. **The build reads the database.** `/` and `/pricing` load plans at build time, so a build pointed at the not-yet-upgraded database fails. Make those pages render at request time, so the new version can be built *before* the database is upgraded, and switched on instantly afterwards.
3. **Guest access code.** The old site's access code for guests abroad came from the `GEO_BYPASS_TOKEN` environment variable. The migration doesn't copy it. Set it as the wedding's access code (Settings → Who can view the site, or `Wedding.geoBypassToken`) so links already shared (`?access=…`) keep working.
4. **Allowed countries.** The migration sets Nigeria only (like the old geo-block). Confirm with the couple which countries they want (Settings → Who can view the site).
5. **Super admin without demo data.** `prisma db seed` also creates demo weddings. **Never run it on production.** Add a small script that only creates the super-admin account from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.
6. **Migrations and Neon's pooler.** `prisma migrate deploy` over the pooled URL (`-pooler` in the host) can leave the migration lock stuck (Prisma error P1002). Run migrations over the **direct** URL (same URL without `-pooler`). Better: add `DIRECT_URL` and point `prisma.config.ts` at it for the CLI.
7. **Nice to have:** on a custom domain, links inside the site show `ayodimeji.online/w/oluwatayo-and-ayomide/…`, and guest emails link to Vowly's address instead of their domain. Both work; fixing them makes the domain feel fully theirs.

## Roles

Fill in before the day.

| Role | Person |
|---|---|
| Lead (runs the steps, calls go / rollback) | |
| Database (Neon branches, migrations, restore) | |
| Vercel (env vars, deployments, rollback) | |
| Testers (checklist below) | |
| Couple contact (tells Oluwatayo & Ayomide) | |

## Phase 1: Rehearsal (days before)

1. **Branch the live database** in the Neon console (e.g. `rehearsal-<date>`). It's an instant copy; nothing touches the live site.
2. **Upgrade the branch**, using its **direct** URL:
   ```bash
   export DATABASE_URL="<rehearsal branch direct URL>"
   npx prisma migrate status                      # expect: behind, sync_schema not applied
   npx prisma migrate resolve --applied 20260924000000_sync_schema   # db push already made these changes
   npx prisma migrate deploy
   npx prisma migrate status                      # expect: up to date
   ```
   If `migrate deploy` fails, stop and investigate. The live site is unaffected.
3. **Set up the data:**
   - `npm run plans:load`: loads Free, Signature and Forever and retires Basic/Premium.
   - Create the super admin (script from issue 5).
   - Apply the theme fix (issue 1), the access code (issue 3) and allowed countries (issue 4).
   - Set the custom domain `ayodimeji.online` on the wedding (staff console → wedding → Custom domain).
   - Check the counts match the live site (RSVPs, registry items, wishes, contributions) and note them:
     ```sql
     SELECT slug, status FROM "Wedding" WHERE id = 'wedding_legacy';
     SELECT (SELECT count(*) FROM "Rsvp") rsvps, (SELECT count(*) FROM "RegistryItem") items,
            (SELECT count(*) FROM "Wish") wishes, (SELECT count(*) FROM "Contribution") contributions;
     ```
4. **Deploy a Vercel preview** of the release branch with the new env vars (below) and `DATABASE_URL` = the rehearsal branch. Point a spare domain at it, or test locally with `ayodimeji.online` as the host:
   ```bash
   curl -H "Host: ayodimeji.online" http://localhost:3000/
   ```
5. **Testers run the [checklist](#test-checklist)** against the preview. Fix, redeploy, retest until it passes.
6. **Practise the rollback** once on the rehearsal branch (restore it from its parent), so the day-of steps are familiar.

## Environment variables (production, new version)

| Variable | Value / note |
|---|---|
| `DATABASE_URL` | Live database (pooled URL is fine for the app) |
| `DIRECT_URL` | Live database, direct URL (if issue 6 is done) |
| `SITE_URL` | **Vowly's own address**, not `ayodimeji.online`. A new Vowly domain on the same Vercel project, or the project's `*.vercel.app` address. If it were `ayodimeji.online`, that domain would show the Vowly landing page. |
| `SESSION_SECRET` | New random value (≥ 32 chars) |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | For the super-admin script only |
| `PAYSTACK_SECRET_KEY` | **Live** key (`sk_live_…`) in production |
| `RESEND_API_KEY`, `EMAIL_FROM` | e.g. `Vowly <hello@…>` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` | Same bucket as today; existing photo URLs keep working |
| `LEGACY_WEDDING_SLUG` | **Do not set.** It redirects `/` to `/w/…` on every domain, including Vowly's own homepage. Custom-domain routing replaces it. |
| `ADMIN_PASSWORD`, `GEO_BYPASS_TOKEN` | No longer used (copy `GEO_BYPASS_TOKEN`'s value per issue 3 first) |

Also add the Paystack webhook URL `https://<SITE_URL host>/api/paystack/webhook` in the Paystack dashboard.

## Phase 2: Cut-over (the scheduled window)

Expected disruption: about a minute during which the old site's forms (RSVP, wishes) may fail.

1. **Go / no-go:** rehearsal passed, fixes merged, everyone present, the couple told about the window.
2. **Build the new version first** as a Vercel preview with production env vars (needs issue 2 fixed), but don't promote it yet.
3. **Back up:** create a Neon branch of the live database named `backup-pre-vowly-<date-time>`. Note the exact time.
4. **Upgrade the live database** (Phase 1 step 2, with the live **direct** URL), then the data set-up (Phase 1 step 3). Compare the counts with the rehearsal numbers plus anything added since.
5. **Promote** the preview to production in Vercel. `ayodimeji.online` stays attached; nothing changes in DNS.
6. **Smoke test immediately:** `ayodimeji.online` loads in their colours; submit a test RSVP (then delete it from the dashboard); `/gallery` and `/wishes` load; sign in on Vowly's address.
7. **Invite the couple** as owners (staff console → wedding → People, or the dashboard). Tell them they now sign in at Vowly's address, not `/admin`.
8. **Watch for an hour:** Vercel function logs, new RSVPs arriving, the staff console.

## Test checklist

Testers, on the rehearsal preview (and quickly again after cut-over):

**Guests on `ayodimeji.online`**
- [ ] `/` shows their site in the original Terracotta & Olive colours, names, date, venue and story
- [ ] `/gallery` and `/wishes` work at those exact addresses; old shared links open the right pages
- [ ] RSVP: submit, confirmation shown, it appears in the dashboard, the confirmation email arrives
- [ ] Wishes: submit, it appears for approval in the dashboard
- [ ] Registry: items and progress match the live site; the gift / bank details are correct
- [ ] From an allowed country: the site shows. From another (VPN): blocked page; with `?access=<code>` it unlocks
- [ ] `/admin` on their domain goes to Vowly's dashboard sign-in
- [ ] Mobile and desktop

**Couple (as owner)**
- [ ] Invite email arrives; they set a password and sign in on Vowly's address
- [ ] Dashboard shows all RSVPs, registry, wishes and contributions, matching the live counts
- [ ] Editing text or a registry item shows on `ayodimeji.online`
- [ ] RSVP export (CSV) contains every attending guest

**Staff**
- [ ] Super admin signs in; `/super` lists the wedding with the legacy plan and custom domain
- [ ] Vowly's own address shows the Vowly landing page (not the wedding)
- [ ] Sign-up → new wedding → preview works (proves multi-tenancy alongside the legacy wedding)

## Rollback

Decide quickly: if a checklist item that guests depend on fails after cut-over and can't be fixed within about 15 minutes, roll back.

1. **Save anything new.** Export RSVPs and wishes created since the cut-over from the new dashboard (CSV) so they can be re-entered.
2. **Vercel:** use Instant Rollback to the last `main` deployment. `ayodimeji.online` serves the old app again.
3. **Neon:** restore the live database from `backup-pre-vowly-<date-time>` (Neon's branch restore / point-in-time restore). The old app needs the old schema; with the upgraded schema it can show pages but can't save RSVPs.
4. **Check:** the old site loads, a test RSVP saves (then delete it), and `/admin` works with `ADMIN_PASSWORD`.
5. **Re-enter** any RSVPs or wishes saved in step 1 through the old `/admin`.
6. Write down what failed; fix it on the branch; rehearse again before rescheduling.

## After a successful cut-over

- Keep `backup-pre-vowly-<date-time>` for at least 30 days, then delete it.
- Remove `ADMIN_PASSWORD` and `GEO_BYPASS_TOKEN` from Vercel.
- Change Vercel's production branch to the Vowly release branch (and retire `main`, or merge into it).
- Update this runbook's status line with the date and outcome.
