# Vowly Revamp: Branch Plans (mine and recommended)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `revamp/mine` (the couple's own picks) and `revamp/recommended` (the recommended set) on top of `revamp/base`, so the two can be compared side by side.

**Architecture:** Part A adds four small shared pieces to `revamp/base` first (onboarding theme default, publish control, RSVP filtering, gift-card references), so neither branch builds them twice. Part B is `revamp/mine`, Part C is `revamp/recommended`; each branches from `revamp/base` after Part A. Logic lives in tested `lib/` helpers; components call them.

**Tech Stack:** Next.js 16 App Router (read `node_modules/next/dist/docs/` before any Next API), React 19, Tailwind v4, Prisma 7, Vitest (node environment, `**/*.test.ts`, no DOM).

**Spec:** the option picker (https://claude.ai/artifact/GZjpNwM1KmDkmnjUPTqtmN), the user's picks in this session, and `docs/superpowers/plans/2026-09-29-revamp-base.md` ("Base provides" and "Found during the walkthrough").

- **Mine:** Global-C, Global-D, Global-F, Landing-A, Pricing-B, Auth-A, Onboard-A, Weddings-A, DashShell-C, Registry-B+C, Inbox-B, RSVPs-B, Story-A, Design-A, Wording-A, People-A, Settings-B, Billing-A, Account-B, GuestHome-B, GuestRSVP-A, GuestGift-B, GuestWall-A, GuestStates-A, Staff-B, System-A. Decisions: Onboard-A lands on a setup checklist card above the tabs (hidden once published); party size shown read-only in admin.
- **Recommended:** Global-B, Global-D, Global-F, Landing-A, Pricing-B, Auth-A, Onboard-A, Weddings-A, DashShell-A, Registry-B+C, Inbox-B, RSVPs-A+C, Story-A, Design-A, Wording-A, People-B, Settings-B, Billing-A, Account-A, GuestHome-A, GuestRSVP-A, GuestGift-A, GuestWall-A, GuestStates-B, Staff-A, System-A.
- Already on base (not repeated here): Global-B, Global-D, Global-F, Landing-A, Pricing-B, Auth-A, Weddings-A, Registry-B+C, Inbox-B, Story-A, Design-A, Wording-A, Settings-B, Billing-A, GuestRSVP-A, GuestWall-A, GuestStates-A, System-A, Staff-B (no change).

## Global Constraints

- Part A commits go on `revamp/base`. Then `git switch revamp/base && git switch -c revamp/mine` for Part B, and `git switch revamp/base && git switch -c revamp/recommended` for Part C. Never commit to `main`, `vowly` or `ui-review`.
- For side-by-side comparison afterwards: `git worktree add ../vowly-mine revamp/mine` and `git worktree add ../vowly-recommended revamp/recommended`, run on ports 3001 and 3002.
- One commit per task, messages ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Local runs only against the throwaway Postgres (`postgresql://postgres@localhost:54329/vowly`, data in the session scratchpad; start with `pg_ctl -D <scratchpad>/pgdata -o "-p 54329 -k ''" start`) with `RESEND_API_KEY=` blank. Test logins: `owner@amara-and-david.test` / `Local-test-9x!`. Never use the Neon database or Resend key in `.env`; never upload to S3.
- Sentence-case copy, no exclamation marks. Guest text ≥ 13px (labels 12px), tap targets ≥ 44px. Keep `lib/ui-guards.test.ts` green.
- Use base's kit and helpers (see base plan "Base provides"); don't add dependencies.
- UI behaviour that can't be unit-tested (no DOM in Vitest) is verified in the browser, and the check is written in the task.

## Review Focus

1. Onboarding for a couple whose starter plan allows no themes list (empty `themes`, meaning all allowed). Expected: the first preset is the default, nothing marked locked. Pinned in Task A1.
2. RSVP search with mixed case, extra spaces and email matches ("  NGOZI ", "ngozi@"). Expected: matches name or email, case-insensitive, trimmed. Pinned in Task A3.
3. Editing an RSVP's party size above the remaining capacity (RSVPs-C). Expected: refused with the "Only N places are left" message, counting the RSVP's own current party as free. Pinned in Task C4.
4. Quick-amount chips when the remaining amount is below the smallest chip. Expected: a single chip for the exact remaining amount, never a chip above it. Pinned in Task C7.
5. A calendar file for a wedding with no place, or names with commas or semicolons. Expected: a valid event without a LOCATION line, text escaped (commas, semicolons, newlines). Pinned in Task C6.

---

## File map

| Path | Responsibility |
|---|---|
| `lib/theme-default.ts` | `defaultPresetKey`, `isPresetIncluded` (Part A) |
| `components/admin/publish-control.tsx` | Status pill + Publish/Unpublish button, shared by both shells (Part A) |
| `lib/rsvp-filter.ts` | `filterRsvps`, `RSVP_FILTERS`, `rsvpFilterCounts` (Part A) |
| `components/guest/transfer-panel.tsx` | Bank rows + reference + name + "I've sent the transfer", used by both gift options (Part A) |
| `components/admin/setup-card.tsx` | Mine: checklist card above tabs |
| `components/admin/account-menu.tsx`, `lib/initials.ts` | Mine: avatar menu |
| `lib/actions/members.ts` (`resendInvite`) | Mine: People-A |
| `lib/dashboard-groups.ts`, `components/admin/overview-tab.tsx` | Recommended: grouped tabs + Overview |
| `lib/rsvp-rules.ts` (`parseAdminRsvp` party size), `lib/capacity.ts` | Recommended: RSVPs-C |
| `lib/ics.ts`, `components/guest/when-where.tsx` | Recommended: GuestHome-A |
| `lib/quick-amounts.ts`, `components/guest/transfer-sheet.tsx` | Recommended: GuestGift-A |
| `app/dashboard/account/page.tsx` | Recommended: Account-A password card |

---

# Part A — base addendum (on `revamp/base`)

### Task A1: Onboarding defaults to a theme the starter plan includes

**Files:** Create `lib/theme-default.ts`, `lib/theme-default.test.ts`. Modify `app/dashboard/new/page.tsx`, `components/admin/create-wedding-form.tsx`.

**Interfaces:**
- Produces: `defaultPresetKey(allowed: string[], presets: readonly { key: string }[]): string`; `isPresetIncluded(allowed: string[], key: string): boolean`. `CreateWeddingForm` gains `includedThemes: string[]`.

- [ ] **Step 1: Failing test** — `lib/theme-default.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defaultPresetKey, isPresetIncluded } from "@/lib/theme-default";

const presets = [{ key: "blush-rose" }, { key: "navy-gold" }, { key: "adire-indigo" }];

describe("defaultPresetKey", () => {
  it("picks the first preset the plan includes", () => {
    expect(defaultPresetKey(["navy-gold", "adire-indigo"], presets)).toBe("navy-gold");
  });
  it("picks the first preset when the plan allows every theme", () => {
    expect(defaultPresetKey([], presets)).toBe("blush-rose");
  });
  it("falls back to the first preset when none of the plan's themes exist", () => {
    expect(defaultPresetKey(["gone"], presets)).toBe("blush-rose");
  });
});

describe("isPresetIncluded", () => {
  it("treats an empty list as every theme", () => {
    expect(isPresetIncluded([], "adire-indigo")).toBe(true);
  });
  it("checks membership otherwise", () => {
    expect(isPresetIncluded(["blush-rose"], "adire-indigo")).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run lib/theme-default.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement** — `lib/theme-default.ts`:

```ts
/** Same rule as planAllowsTheme: an empty list means the plan includes every theme. */
export function isPresetIncluded(allowed: string[], key: string) {
  return allowed.length === 0 || allowed.includes(key);
}

/** The theme a new site starts on: the first one the couple can publish on their starting plan. */
export function defaultPresetKey(allowed: string[], presets: readonly { key: string }[]) {
  return (presets.find((p) => isPresetIncluded(allowed, p.key)) ?? presets[0]).key;
}
```

- [ ] **Step 4:** re-run → PASS.

- [ ] **Step 5: Wire it.** `app/dashboard/new/page.tsx`: `const starter = await getStarterPlan();` and pass `includedThemes={starter?.themes ?? []}`. In `create-wedding-form.tsx`: `useState(() => defaultPresetKey(includedThemes, THEME_PRESETS))` replaces `"adire-indigo"`; each preset button whose key isn't included shows a small `<span className="text-[13px] text-muted">Needs an upgrade to publish</span>` under its name (still selectable: drafts can preview any theme).

- [ ] **Step 6: Verify** — `npx vitest run && npx tsc --noEmit && npm run lint`; in the browser sign up a new local user: Blush Rose is preselected, Adire Indigo shows "Needs an upgrade to publish", and Publish in Settings works without changing theme.

- [ ] **Step 7: Commit** `fix(onboarding): start new sites on a theme the free plan includes`.

### Task A2: Shared publish control

**Files:** Create `components/admin/publish-control.tsx`. Modify `components/admin/settings-tab.tsx` (use it in `PublishPanel`).

**Interfaces:**
- Produces: `PublishControl({ status, canPublish, compact? }: { status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED"; canPublish: boolean; compact?: boolean })` — renders a status chip ("Draft" / "Live" / "Suspended") and, for owners, a Publish or Unpublish button calling `setPublished`, with errors in an error toast. `compact` renders chip + small button for headers.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import { setPublished } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAdminWeddingId } from "./wedding-context";

type Status = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";

const CHIP: Record<Status, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-action/25 text-ink" },
  ACTIVE: { label: "Live", className: "bg-success/12 text-success" },
  SUSPENDED: { label: "Suspended", className: "bg-danger/12 text-danger" },
  ARCHIVED: { label: "Archived", className: "bg-line text-muted" },
};

/** The site's status and the one button that changes it. Server refuses non-owners too. */
export default function PublishControl({ status, canPublish, compact = false }: { status: Status; canPublish: boolean; compact?: boolean }) {
  const weddingId = useAdminWeddingId();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const live = status === "ACTIVE";
  const locked = status === "SUSPENDED" || status === "ARCHIVED";

  const toggle = async () => {
    setPending(true);
    const result = await setPublished(weddingId, !live);
    setPending(false);
    if (result.error) toast({ message: result.error, tone: "error" });
    else toast({ message: live ? "Site unpublished" : "Site published" });
  };

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${CHIP[status].className}`}>{CHIP[status].label}</span>
      {!locked && (
        <Button
          variant={live ? "secondary" : "primary"}
          size={compact ? "sm" : "md"}
          onClick={toggle}
          disabled={pending || (!live && !canPublish)}
          title={!live && !canPublish ? "Choose a plan in Billing to publish" : undefined}
        >
          {pending ? "Saving…" : live ? "Unpublish" : "Publish site"}
        </Button>
      )}
    </span>
  );
}
```

- [ ] **Step 2:** In `settings-tab.tsx` `PublishPanel`, replace its button/error block with `<PublishControl status={settings.status} canPublish={settings.canPublish} />` (keep the heading and explanation).

- [ ] **Step 3: Verify** — tsc, lint, vitest; browser: Settings → Publish, toast "Site published"; Unpublish, toast "Site unpublished".

- [ ] **Step 4: Commit** `refactor(settings): shared publish control for the dashboard header and overview`.

### Task A3: RSVP search and filters (logic)

**Files:** Create `lib/rsvp-filter.ts`, `lib/rsvp-filter.test.ts`.

**Interfaces:**
- Produces: `type RsvpFilter = "all" | "attending" | "declined" | "noEmail" | "notConfirmed"`; `RSVP_FILTERS: { id: RsvpFilter; label: string }[]`; `filterRsvps<T extends RsvpLike>(rsvps: T[], query: string, filter: RsvpFilter): T[]`; `rsvpFilterCounts(rsvps: RsvpLike[]): Record<RsvpFilter, number>` where `RsvpLike = { guestName: string; email: string; attending: boolean; confirmationSentAt: string | null }`.

- [ ] **Step 1: Failing test** — `lib/rsvp-filter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filterRsvps, rsvpFilterCounts } from "@/lib/rsvp-filter";

const r = (guestName: string, attending: boolean, email = "", confirmationSentAt: string | null = null) => ({ guestName, email, attending, confirmationSentAt });
const list = [
  r("Ngozi Adeyemi", true, "ngozi@example.com", "2026-09-14"),
  r("Femi Bello", false),
  r("Kelechi Obi", true, "kc@example.com"),
  r("Amaka Nwosu", true),
];

describe("filterRsvps", () => {
  it("matches name or email, ignoring case and spaces", () => {
    expect(filterRsvps(list, "  NGOZI ", "all").map((x) => x.guestName)).toEqual(["Ngozi Adeyemi"]);
    expect(filterRsvps(list, "kc@", "all").map((x) => x.guestName)).toEqual(["Kelechi Obi"]);
  });
  it("filters by reply and email state", () => {
    expect(filterRsvps(list, "", "declined").map((x) => x.guestName)).toEqual(["Femi Bello"]);
    expect(filterRsvps(list, "", "noEmail").map((x) => x.guestName)).toEqual(["Femi Bello", "Amaka Nwosu"]);
    expect(filterRsvps(list, "", "notConfirmed").map((x) => x.guestName)).toEqual(["Kelechi Obi"]);
  });
  it("combines search and filter", () => {
    expect(filterRsvps(list, "a", "attending").map((x) => x.guestName)).toEqual(["Ngozi Adeyemi", "Amaka Nwosu"]);
  });
});

describe("rsvpFilterCounts", () => {
  it("counts each filter", () => {
    expect(rsvpFilterCounts(list)).toEqual({ all: 4, attending: 3, declined: 1, noEmail: 2, notConfirmed: 1 });
  });
});
```

("notConfirmed" = has an email, confirmation not sent yet.)

- [ ] **Step 2:** run → FAIL.

- [ ] **Step 3: Implement** — `lib/rsvp-filter.ts`:

```ts
type RsvpLike = { guestName: string; email: string; attending: boolean; confirmationSentAt: string | null };

export type RsvpFilter = "all" | "attending" | "declined" | "noEmail" | "notConfirmed";

export const RSVP_FILTERS: { id: RsvpFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attending", label: "Attending" },
  { id: "declined", label: "Declined" },
  { id: "noEmail", label: "No email" },
  { id: "notConfirmed", label: "Not confirmed" },
];

const MATCHES: Record<RsvpFilter, (r: RsvpLike) => boolean> = {
  all: () => true,
  attending: (r) => r.attending,
  declined: (r) => !r.attending,
  noEmail: (r) => !r.email,
  notConfirmed: (r) => Boolean(r.email) && !r.confirmationSentAt,
};

/** RSVPs matching a search (name or email) and one filter chip. */
export function filterRsvps<T extends RsvpLike>(rsvps: T[], query: string, filter: RsvpFilter): T[] {
  const q = query.trim().toLowerCase();
  return rsvps.filter((r) => MATCHES[filter](r) && (!q || r.guestName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)));
}

export function rsvpFilterCounts(rsvps: RsvpLike[]): Record<RsvpFilter, number> {
  return Object.fromEntries(RSVP_FILTERS.map((f) => [f.id, rsvps.filter(MATCHES[f.id]).length])) as Record<RsvpFilter, number>;
}
```

- [ ] **Step 4:** run → PASS. **Step 5: Commit** `feat(rsvp): search and filter helpers for the guest list`.

### Task A4: Gift card transfer panel with references

**Files:** Create `components/guest/transfer-panel.tsx`. Modify `components/guest/gift-card.tsx` (both BUY and CHIPIN paths use it; the duplicated bank-row blocks go).

**Interfaces:**
- Consumes: `transferReference` (base), `submitContribution` (accepts `reference`).
- Produces: `TransferPanel({ gift, bankDetails, amountCents, onSent }: { gift: RegistryItemWithContributions; bankDetails: BankDetailsView; amountCents: number; onSent: () => void })` — shows numbered steps: "1. Send {amount} from your bank app" with `CopyRow`s for Bank, Account no., Account name, and Reference (a `transferReference(gift.name)` created once with `useState(() => …)`); "2. Tell the couple it's from you" with a labelled name field and a full-width `guest-btn` "I've sent the transfer" that posts `registryItemId`, `guestName`, `amountCents`, `reference`; errors in `role="alert"`; calls `onSent` on success. Both branch gift options build on this.

- [ ] **Step 1:** Write `transfer-panel.tsx` with the behaviour above (state: `reference` via lazy `useState`, `guestName`, `pending`, `error`; submission identical to `gift-card.tsx`'s current `submitContributionOf`, plus `formData.set("reference", reference)`).
- [ ] **Step 2:** In `gift-card.tsx`, replace the two panels' bank rows, name inputs and confirm buttons with `<TransferPanel … amountCents={action === "BUY" ? gift.priceCents : amountCents} onSent={() => setSubmitted(true)} />`; the CHIPIN path keeps its amount field above the panel. Remove the now-unused `submitContributionOf`/`handleContribution`/`handleBuyTransfer` and the old "Confirm Transfer" wording.
- [ ] **Step 3: Verify** — tsc, lint, vitest (guest guards). Browser (local): contribute ₦20,000 to a gift; the dashboard Contributions row shows a reference like `HONEY-7KQ2MX`, and the confirm dialog says "with the reference HONEY-7KQ2MX".
- [ ] **Step 4: Commit** `feat(gifts): guests see and send a unique transfer reference`.

Then note in the base plan's ledger that Part A is done and branch.

---

# Part B — `revamp/mine`

### Task B1: DashShell-C — header status, badges, scroll hint

**Files:** Modify `components/admin/home.tsx`, `app/dashboard/[weddingId]/page.tsx`.

**Interfaces:** Consumes `PublishControl` (A2). `AdminHome` gains `status` and `canPublish` (from `settings`, already passed — reuse `settings.status`/`settings.canPublish`).

- [ ] **Step 1:** Header: title on the left; on the right `{isOwner ? <PublishControl status={settings.status} canPublish={settings.canPublish} compact /> : <StatusChip />}` then "View guest site". Non-owners see the chip only (reuse `PublishControl` with a `readOnly` path: add prop `readOnly?: boolean` that hides the button).
- [ ] **Step 2:** Replace the "Guest uploads" stat with "Attending" (`sum of guestCount over attending rsvps` / `capacity`), keep Total raised, Items fully funded, Wishes.
- [ ] **Step 3:** Tab badges: Contributions (`pendingContributions.length`), Photos (`pendingMedia.length`), Wishes (`pendingWishes.length`) show `<span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[12px] font-bold text-white" aria-label="N waiting">N</span>` when > 0.
- [ ] **Step 4:** Scroll hint: wrap the tablist in a `relative` div with a right-edge gradient (`pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-paper`) shown only when the strip overflows (`scrollWidth > clientWidth`, re-checked on resize and scroll; hidden when scrolled to the end).
- [ ] **Step 5: Verify** in the browser at 1280 and in a 390px iframe: badges show counts; fade visible on phones and gone at the end of the strip; Publish in the header works (toast). Commit `feat(dashboard): status and publish in the header, waiting counts on tabs`.

### Task B2: Onboard-A (mine) — setup checklist card

**Files:** Create `components/admin/setup-card.tsx`. Modify `home.tsx`, `app/dashboard/[weddingId]/page.tsx`.

**Interfaces:** Consumes `setupSteps` (base) and `dashboardTabHref`. Page passes `setup = setupSteps({ hasStory: Boolean(story?.howWeMet) || storyBeats.length > 0, hasBankDetails: Boolean(bankDetails?.account), registryCount: registryItems.length, hasHeroPhoto: Boolean(story?.heroPhotoUrl) || storyPhotos.some((p) => p.showInHero), status: wedding.status })`.

- [ ] **Step 1:** `SetupCard({ steps, onGo })`: a `Card` above the tabs titled "Finish setting up", a progress bar (`done/total`), and the steps as a list: done steps with a check and muted text; the first not-done step as a primary `Button` ("Add bank details") that calls `onGo(step.tab)`; the rest as text buttons. A "Hide for now" text button stores `vowly-setup-hidden-<weddingId>` in `localStorage` (try/catch).
- [ ] **Step 2:** `home.tsx` renders it only when the site isn't live (`settings.status !== "ACTIVE"`) and not hidden; `onGo` calls `selectTab`.
- [ ] **Step 3: Verify** — new local wedding shows 1 of 6 done; clicking "Add bank details" opens Registry; after publishing the card is gone. Commit `feat(dashboard): setup checklist until the site is live`.

### Task B3: RSVPs-B — search, top toolbar, quiet send

**Files:** Modify `components/admin/rsvp-tab.tsx`.

**Interfaces:** Consumes `filterRsvps` (A3).

- [ ] **Step 1:** Toolbar row under the heading: a labelled search field (`<label className="sr-only" htmlFor="rsvp-search">Search guests</label>`, `type="search"`, placeholder "Search by name or email") on the left; Export, Import, Add RSVP on the right (Export moves up from the bottom, `variant="secondary"`).
- [ ] **Step 2:** Table rows come from `filterRsvps(rsvps, query, "all")`, paged; empty result shows `EmptyState title="No guests match" body="Try another name or email."`.
- [ ] **Step 3:** Per-row "Send confirmation" becomes `<Button variant="text" size="sm">Send email</Button>`; the stat tiles become `TableShell`-matching `Card`s: "Attending {n} / {capacity}", "Declined {n}".
- [ ] **Step 4: Verify** browser: typing "ngo" filters to Ngozi; Export still downloads (check the Party column). Commit `feat(rsvp): search the guest list and tidy the toolbar`.

### Task B4: People-A — labels, role cards, resend invite

**Files:** Modify `components/admin/members-tab.tsx`, `lib/actions/members.ts`.

**Interfaces:** Produces `resendInvite(weddingId: string, memberId: string): Promise<{ error?: string; message?: string }>` — `requireWeddingAccess(weddingId, "owner", "resendInvite")`; finds the member scoped to the wedding with its user; refuses if the user has a password ("They've already set up their account"); rate-limits with `takeRateLimit("member:invite", wedding.id, 20, DAY)`; calls `sendInvite(user, coupleTitle(...))`; returns `{ message: "Invite sent again to …" }`.

- [ ] **Step 1:** Add `resendInvite` as above (copy the `sendInvite`/`coupleTitle` lines from `inviteMember`).
- [ ] **Step 2:** Invite form: `TextInput label="Email address"`; roles as two radio cards (`role="radio"` group, `name="role"`, hidden input) — "Editor: can edit everything except settings and billing", "Owner: can also invite people, publish and pay"; submit "Send invite".
- [ ] **Step 3:** Member rows: name/email, a role chip, "Invite pending" chip, and for pending invites a text button "Resend invite" (owner only) that calls `resendInvite` and toasts the message or error.
- [ ] **Step 4: Verify** (local, blank Resend key so mail is only logged): invite `helper@vowly.test`, then Resend → toast "Invite sent again…", server log shows the skipped mail. Commit `feat(people): clearer invite form and resend for pending invites`.

### Task B5: Account-B — avatar menu

**Files:** Create `lib/initials.ts`, `lib/initials.test.ts`, `components/admin/account-menu.tsx`. Modify `components/admin/dashboard-bar.tsx`, `app/dashboard/layout.tsx` (pass the user).

**Interfaces:** Produces `initials(name: string | null, email: string): string`.

- [ ] **Step 1: Failing test:**

```ts
import { describe, expect, it } from "vitest";
import { initials } from "@/lib/initials";

describe("initials", () => {
  it("uses the first letters of the first and last name", () => {
    expect(initials("Ifeoma Chioma Okafor", "x@y.z")).toBe("IO");
  });
  it("uses one letter for a single name", () => {
    expect(initials("Ifeoma", "x@y.z")).toBe("I");
  });
  it("falls back to the email", () => {
    expect(initials(null, "dayo@example.com")).toBe("D");
    expect(initials("   ", "dayo@example.com")).toBe("D");
  });
});
```

- [ ] **Step 2:** run → FAIL. **Step 3: Implement:**

```ts
/** "IO" for Ifeoma Okafor; the email's first letter when there's no name. */
export function initials(name: string | null, email: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return email.charAt(0).toUpperCase();
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}
```

- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** `AccountMenu({ name, email, showConsole })` (client): a 40px rounded-square button with the initials (`aria-haspopup="menu"`, `aria-expanded`), opening a menu (`role="menu"`, items `role="menuitem"`): the name and email as a header, "Account" (or "My profile" for staff), "Change password" (`/change-password`), "Your weddings" (`/dashboard`), divider, "Sign out" (a form posting `logout`). Closes on Escape, outside click and item choice; arrow keys move between items; focus returns to the button.
- [ ] **Step 6:** `DashboardBar` renders `AccountMenu` instead of the Account link and Sign out button. It needs the user: make `DashboardBar` take `user: { name: string | null; email: string }` and pass it from its callers (`verifySession()` result).
- [ ] **Step 7: Verify** browser: keyboard open (Enter), arrows, Escape returns focus; Sign out works. Commit `feat(dashboard): account menu under your initials`.

### Task B6: GuestHome-B — RSVP in the phone nav, time on the cover hero

**Files:** Modify `components/guest/nav-client.tsx`, `components/guest/heroes/cover.tsx`.

- [ ] **Step 1:** In the phone bar (below `sm`), when `show.rsvp`, render the RSVP link as a small filled button (`bg-burnt-orange text-ivory px-3 min-h-9 text-[13px] font-semibold`) before the menu button; the menu keeps the other links.
- [ ] **Step 2:** Cover hero date line becomes `{h.dateFull}{h.time ? ` · ${h.time}` : ""}{h.location ? ` · ${h.location}` : ""}`.
- [ ] **Step 3: Verify** in a 390px iframe: RSVP visible without opening the menu and scrolls to the form; cover template shows the time. Commit `feat(guest): RSVP always visible on phones and the time on the cover`.

### Task B7: GuestGift-B — clean inline panel

**Files:** Modify `components/guest/gift-card.tsx`.

**Interfaces:** Consumes `TransferPanel` (A4).

- [ ] **Step 1:** Card layout: name (serif 22px), price, progress; actions "Buy it" / "Chip in" as two 44px buttons (`guest-btn` and an outline variant). Choosing one reveals, inline, for Chip in: a labelled amount field (min shown as hint); then `TransferPanel`. A "Close" text button collapses it.
- [ ] **Step 2:** Images `loading="lazy"` (drop `eager`).
- [ ] **Step 3: Verify** 390px iframe: text ≥ 13px (guard passes), contribution goes through with a reference. Commit `feat(guest): simpler inline gift giving`.

### Task B8: Global-C — the app skin (last)

**Files:** Modify `components/marketing/brand.ts` (dashboard-only tokens), `app/dashboard/layout.tsx`, `components/ui/card.tsx`, `components/ui/table.tsx`, `components/ui/button.tsx`, and the tabs that show more than one primary button per view.

- [ ] **Step 1: Tokens.** Add `APP_STYLE` in `brand.ts` = `BRAND_STYLE` plus `"--m-paper": "#e9ecf5"` (tinted page) and `"--surface-muted": "#f4f5f9"`; use it in `app/dashboard/layout.tsx` and `app/super/layout.tsx` instead of `BRAND_STYLE`.
- [ ] **Step 2: Kit.** `Card`: `rounded-[10px] bg-surface p-5` (no border); `TableShell`: no border, `rounded-[10px]`, row cells `py-2.5`; stat tiles in `home.tsx` use `Card` with `p-4`.
- [ ] **Step 3: One gold action per view.** Grep `variant="primary"` / `buttonClass("primary"` in `components/admin`; in each tab keep primary only for the main action (Registry: Add a gift; RSVPs: Add RSVP; Settings: Save settings; Story: Save story; Wording: Save wording; Design: Save design; header: Publish) and make the rest `secondary`. Row-level Confirm/Approve stay primary only in Contributions and the review tabs' Pending view.
- [ ] **Step 4: Verify** — every dashboard tab and `/super/*` at 1280 and 390: no borders doubled, contrast of `text-muted` on the tinted page ≥ 4.5:1 (`#5a6285` on `#e9ecf5` = 5.3:1), one gold button per view. Commit `feat(ui): quieter app skin for the dashboard`.

### Task B9: Whole-branch check (mine)

- [ ] `npx vitest run && npx tsc --noEmit && npm run lint && npm run build`.
- [ ] Walkthrough (local, 1280 + 390 iframe): sign up → onboarding (Blush Rose default) → setup card → bank → gift → publish from header → guest RSVP (party 2) and contribution with reference → confirm + undo → RSVP search → account menu sign out.
- [ ] Commit any fixes; then final review per executing-plans.

---

# Part C — `revamp/recommended`

### Task C1: Grouped tabs (logic)

**Files:** Create `lib/dashboard-groups.ts`, `lib/dashboard-groups.test.ts`.

**Interfaces:**
- Consumes `DASHBOARD_TABS`, `TabId` (base).
- Produces: `type GroupId = "overview" | "guests" | "gifts" | "site" | "moments" | "settings"`; `DASHBOARD_GROUPS: { id: GroupId; label: string; sections: (TabId | "overview")[] }[]`; `type SectionId = TabId | "overview"`; `sectionFromParam(param: string | string[] | undefined, isOwner: boolean): SectionId` (default `"overview"`); `groupOf(section: SectionId): GroupId`; `visibleSections(group: GroupId, isOwner: boolean): SectionId[]`.
- Groups: overview → [overview]; guests → [rsvps]; gifts → [registry, contributions]; site → [story, design, wording]; moments → [media, wishes]; settings → [settings, people, billing] (settings/billing owner-only; for editors the Settings group shows People only).

- [ ] **Step 1: Failing test:**

```ts
import { describe, expect, it } from "vitest";
import { groupOf, sectionFromParam, visibleSections } from "@/lib/dashboard-groups";

describe("sectionFromParam", () => {
  it("opens the overview by default", () => {
    expect(sectionFromParam(undefined, true)).toBe("overview");
    expect(sectionFromParam("nope", true)).toBe("overview");
  });
  it("still accepts the old tab links", () => {
    expect(sectionFromParam("billing", true)).toBe("billing");
    expect(sectionFromParam("rsvps", false)).toBe("rsvps");
  });
  it("sends editors away from owner-only sections", () => {
    expect(sectionFromParam("billing", false)).toBe("overview");
  });
});

describe("groups", () => {
  it("finds a section's group", () => {
    expect(groupOf("contributions")).toBe("gifts");
    expect(groupOf("people")).toBe("settings");
  });
  it("hides owner-only sections from editors", () => {
    expect(visibleSections("settings", false)).toEqual(["people"]);
    expect(visibleSections("settings", true)).toEqual(["settings", "people", "billing"]);
  });
});
```

- [ ] **Step 2:** run → FAIL. **Step 3: Implement:**

```ts
import { DASHBOARD_TABS, type TabId } from "@/lib/dashboard-tabs";

export type SectionId = TabId | "overview";
export type GroupId = "overview" | "guests" | "gifts" | "site" | "moments" | "settings";

export const DASHBOARD_GROUPS: { id: GroupId; label: string; sections: SectionId[] }[] = [
  { id: "overview", label: "Overview", sections: ["overview"] },
  { id: "guests", label: "Guests", sections: ["rsvps"] },
  { id: "gifts", label: "Gifts", sections: ["registry", "contributions"] },
  { id: "site", label: "Site", sections: ["story", "design", "wording"] },
  { id: "moments", label: "Moments", sections: ["media", "wishes"] },
  { id: "settings", label: "Settings", sections: ["settings", "people", "billing"] },
];

function ownerOnly(section: SectionId) {
  const tab = DASHBOARD_TABS.find((t) => t.id === section);
  return Boolean(tab && "ownerOnly" in tab && tab.ownerOnly);
}

export function sectionFromParam(param: string | string[] | undefined, isOwner: boolean): SectionId {
  const all = DASHBOARD_GROUPS.flatMap((g) => g.sections);
  const found = all.find((s) => s === param);
  if (!found || (ownerOnly(found) && !isOwner)) return "overview";
  return found;
}

export function groupOf(section: SectionId): GroupId {
  return DASHBOARD_GROUPS.find((g) => g.sections.includes(section))!.id;
}

export function visibleSections(group: GroupId, isOwner: boolean): SectionId[] {
  return DASHBOARD_GROUPS.find((g) => g.id === group)!.sections.filter((s) => isOwner || !ownerOnly(s));
}
```

- [ ] **Step 4:** run → PASS. **Step 5: Commit** `feat(dashboard): grouped sections for the overview layout`.

### Task C2: DashShell-A — Overview and grouped navigation

**Files:** Create `components/admin/overview-tab.tsx`. Modify `components/admin/home.tsx`, `app/dashboard/[weddingId]/page.tsx`, `lib/actions/weddings.ts` (redirect), `app/dashboard/[weddingId]/billing/page.tsx` (link stays `?tab=billing`; works).

**Interfaces:** Consumes C1, `PublishControl` (A2), `setupSteps` (base). Page passes `initialSection = sectionFromParam((await searchParams).tab, isOwner)` (replaces `initialTab`) and `setup = setupSteps({ hasStory: Boolean(story?.howWeMet) || storyBeats.length > 0, hasBankDetails: Boolean(bankDetails?.account), registryCount: registryItems.length, hasHeroPhoto: Boolean(story?.heroPhotoUrl) || storyPhotos.some((p) => p.showInHero), status: wedding.status })`.

- [ ] **Step 1:** Top tabs render `DASHBOARD_GROUPS` (hide the Settings group for editors only if it has no visible sections — it always has People) with waiting-count badges on Gifts (pending contributions) and Moments (pending photos + wishes). The active group's sections (when more than one) render beneath as a `Segmented` ("Registry | Contributions"). URL `?tab=<section>` via `replaceState`; arrow keys on the top tabs as in base.
- [ ] **Step 2:** `OverviewTab({ setup, needs, stats, status, canPublish, onGo })`:
  - Header row: `PublishControl` (owners) and "View guest site".
  - "Finish setting up" card (hidden once all done): a progress bar (`done/total`) and the steps as a list — done steps with a check and muted text, the first not-done step as a primary `Button` calling `onGo(step.tab)`, the rest as text buttons.
  - "Needs you" card: rows "Transfers to confirm", "Photos to review", "Wishes to review" with counts, each a text button to its section; "You're all caught up" when all zero.
  - Stats: Attending `n / capacity`, Raised, Photos, Days to go (`countdownLabel` from base).
- [ ] **Step 3:** `createWedding` redirect → `${dashboardPath(wedding.id)}?tab=overview` (Onboard-A).
- [ ] **Step 4: Verify** browser: new wedding lands on Overview with 1/6 done; clicking "Add bank details" opens Gifts › Registry; `?tab=billing` still opens Settings › Billing; editor login sees Settings › People only. Commit `feat(dashboard): overview with setup and what needs you, grouped sections`.

### Task C3: People-B — People inside Settings

**Files:** Modify `components/admin/home.tsx` (Settings group shows `settings`, `people`, `billing` sections via the segmented control — already true after C2), `components/admin/members-tab.tsx` (heading "People", labelled email field `TextInput label="Email address"`, role `SelectInput label="Role"`).

- [ ] **Step 1:** Apply the label changes. **Step 2: Verify** Settings › People shows the invite form with visible labels. Commit `feat(people): people live under settings, with labelled fields`.

### Task C4: RSVPs-C — editable party size (logic + actions)

**Files:** Modify `lib/rsvp-rules.ts`, `lib/rsvp-rules.test.ts`, `lib/actions/rsvp.ts`.

**Interfaces:** `parseAdminRsvp` input gains optional `partySize: unknown`; output `data` gains `guestCount?: number` only when `partySize` is a non-empty value (1..`MAX_PARTY_SIZE`). `updateRsvpAdmin` checks capacity with the RSVP's own current party freed: `capacityError(newCount, seatsLeft(capacity, takenByOthers))`.

- [ ] **Step 1: Failing tests** (append):

```ts
describe("parseAdminRsvp party size", () => {
  const row = { guestName: "Ngozi Adeyemi", email: "", attending: true, message: "" };
  it("carries a party size only when the form sends one", () => {
    expect(parseAdminRsvp({ ...row, partySize: "3" })).toMatchObject({ data: { guestCount: 3 } });
    const none = parseAdminRsvp({ ...row, partySize: "" });
    expect("data" in none && "guestCount" in none.data).toBe(false);
  });
  it("rejects party sizes out of range", () => {
    expect(parseAdminRsvp({ ...row, partySize: "0" })).toEqual({ error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` });
  });
});

describe("capacity when editing", () => {
  it("frees the guest's own seats before checking", () => {
    // capacity 10, 9 taken in total, this RSVP holds 3 of them: 4 seats for this party
    expect(capacityError(4, seatsLeft(10, 9 - 3))).toBeNull();
    expect(capacityError(5, seatsLeft(10, 9 - 3))).toBe("Only 4 places are left. Please reduce your party size.");
  });
});
```

(import `capacityError`, `seatsLeft` from `@/lib/capacity` in the test file.)

- [ ] **Step 2:** run → FAIL on the first test. **Step 3:** in `parseAdminRsvp`, when `typeof input.partySize === "string" && input.partySize.trim()`, parse as in `parseGuestRsvp` and add `guestCount`; the base test "never carries a party size" still passes because it sends none. In `updateRsvpAdmin`, when `parsed.data.guestCount` is set and the RSVP is attending: `taken = sum(guestCount of attending) - existing.guestCount (if existing attending)`; refuse with `capacityError`. `parseAdminRsvpForm` passes `partySize: formData.get("partySize")`.
- [ ] **Step 4:** run → PASS. **Step 5:** admin RSVP form gets a `TextInput label="Party size" name="partySize" type="number" min={1} max={MAX_PARTY_SIZE}` prefilled from `initialValues.guestCount` (empty for new rows means 1). Commit `feat(rsvp): couples can set a guest's party size`.

### Task C5: RSVPs-A — guest list manager

**Files:** Modify `components/admin/rsvp-tab.tsx`.

**Interfaces:** Consumes `filterRsvps`, `rsvpFilterCounts`, `RSVP_FILTERS` (A3).

- [ ] **Step 1:** Summary card: "{attending} attending of {capacity}" with a bar, then "{declined} declined · {notConfirmed} without a confirmation email".
- [ ] **Step 2:** Toolbar: search field (labelled, as B3), filter chips from `RSVP_FILTERS` with counts (`Segmented`-style buttons, `aria-pressed`), and actions Import, Export, "Send all confirmations" (loops `sendRsvpConfirmation` over the `notConfirmed` list sequentially, then toasts "Sent N confirmations" or the first error), Add guest (primary).
- [ ] **Step 3:** Rows: name + email under it, reply chip, Party, Email sent date or "Send" text button, Edit/Delete. Below `sm`, rows render as stacked cards (a `<ul>` of `Card`s) instead of the table.
- [ ] **Step 4: Verify** browser: chips filter and counts match; 390px iframe shows cards with no horizontal scroll; Send all with blank Resend key logs sends. Commit `feat(rsvp): guest list manager with search, filters and bulk confirmations`.

### Task C6: GuestHome-A — When and where, calendar file, pinned RSVP

**Files:** Create `lib/ics.ts`, `lib/ics.test.ts`, `components/guest/when-where.tsx`. Modify `components/guest/home.tsx`, `components/guest/nav-client.tsx` (phone: pinned RSVP button).

**Interfaces:** Produces `icsEvent({ title, start, durationHours, location, url }: { title: string; start: Date; durationHours?: number; location?: string | null; url?: string }): string`.

- [ ] **Step 1: Failing test:**

```ts
import { describe, expect, it } from "vitest";
import { icsEvent } from "@/lib/ics";

describe("icsEvent", () => {
  it("writes a timed event in UTC", () => {
    const ics = icsEvent({ title: "Amara & David's wedding", start: new Date("2026-12-12T13:00:00Z"), location: "Lagos", url: "https://vowly.ng/w/amara-and-david" });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261212T130000Z");
    expect(ics).toContain("DTEND:20261212T190000Z");
    expect(ics).toContain("LOCATION:Lagos");
    expect(ics.split("\r\n").length).toBeGreaterThan(5);
  });
  it("escapes commas, semicolons and new lines", () => {
    const ics = icsEvent({ title: "A, B; C", start: new Date("2026-12-12T13:00:00Z"), location: "Line 1\nLine 2" });
    expect(ics).toContain("SUMMARY:A\\, B\\; C");
    expect(ics).toContain("LOCATION:Line 1\\nLine 2");
  });
  it("leaves out an empty place", () => {
    expect(icsEvent({ title: "W", start: new Date("2026-12-12T13:00:00Z"), location: null })).not.toContain("LOCATION");
  });
});
```

- [ ] **Step 2:** run → FAIL. **Step 3: Implement:**

```ts
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const text = (s: string) => s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");

/** A one-event calendar file guests can add to their phone's calendar. */
export function icsEvent({ title, start, durationHours = 6, location, url }: { title: string; start: Date; durationHours?: number; location?: string | null; url?: string }) {
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vowly//Wedding//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(start)}-${text(title).length}@vowly`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${text(title)}`,
    ...(location ? [`LOCATION:${text(location)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
```

- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** `WhenWhere` (server component, rendered right after the hero in `home.tsx`): serif date, time, location; buttons "Add to calendar" (client child: builds a Blob from `icsEvent` and downloads `wedding.ics`) and "Directions" (`https://www.google.com/maps/search/?api=1&query=<encoded location>`, only when location set; city only, the full address stays private).
- [ ] **Step 6:** Phone RSVP: when `show.rsvp`, a pinned `guest-btn` "RSVP" bar at the bottom below `sm` (hidden once `#rsvp` is on screen, via IntersectionObserver), with `pb-safe` spacing (`env(safe-area-inset-bottom)`).
- [ ] **Step 7: Verify** browser + 390 iframe; the downloaded `.ics` opens in Calendar. Commit `feat(guest): when and where with add to calendar, RSVP pinned on phones`.

### Task C7: GuestGift-A — guided sheet

**Files:** Create `lib/quick-amounts.ts`, `lib/quick-amounts.test.ts`, `components/guest/transfer-sheet.tsx`. Modify `components/guest/gift-card.tsx`.

**Interfaces:** Produces `quickAmounts(remainingCents: number, currency: string): number[]` (up to 3 chips in minor units). Consumes `TransferPanel` (A4), `minContribution` (money.ts).

- [ ] **Step 1: Failing test:**

```ts
import { describe, expect, it } from "vitest";
import { quickAmounts } from "@/lib/quick-amounts";

describe("quickAmounts", () => {
  it("offers naira steps below what's left", () => {
    expect(quickAmounts(500_000_00, "NGN")).toEqual([10_000_00, 20_000_00, 50_000_00]);
  });
  it("never offers more than what's left", () => {
    expect(quickAmounts(30_000_00, "NGN")).toEqual([10_000_00, 20_000_00, 30_000_00]);
  });
  it("offers just the remainder when it's below the smallest step", () => {
    expect(quickAmounts(4_500_00, "NGN")).toEqual([4_500_00]);
  });
  it("uses smaller steps for other currencies", () => {
    expect(quickAmounts(500_00, "GBP")).toEqual([20_00, 50_00, 100_00]);
  });
});
```

- [ ] **Step 2:** run → FAIL. **Step 3: Implement:**

```ts
const STEPS: Record<string, number[]> = {
  NGN: [10_000_00, 20_000_00, 50_000_00],
};
const DEFAULT_STEPS = [20_00, 50_00, 100_00];

/** Up to three one-tap amounts for chipping in, capped at what's left (which is always offered when reached). */
export function quickAmounts(remainingCents: number, currency: string) {
  const steps = STEPS[currency] ?? DEFAULT_STEPS;
  const below = steps.filter((s) => s < remainingCents);
  if (below.length === steps.length) return below;
  return [...below, remainingCents];
}
```

- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** `TransferSheet` (client): a bottom sheet (`role="dialog" aria-modal`, focus trap as in the lightbox, Escape closes, scroll lock) with steps "1 of 3 Amount" (chips from `quickAmounts` + "Other amount" field; Buy skips this step with the full price), "2 of 3 Send it" and "3 of 3 Tell the couple" rendered by `TransferPanel` split in two (bank rows + reference, then name + "I've sent it"), Back/Continue, and a thank-you state.
- [ ] **Step 6:** `gift-card.tsx`: Buy / Chip in open the sheet instead of the inline panel; card body shrinks to image, name, price, progress and the two buttons.
- [ ] **Step 7: Verify** 390px iframe: chips, focus stays in the sheet, contribution saved with reference. Commit `feat(guest): guided gift sheet with amount chips`.

### Task C8: GuestStates-B — contact the couple

**Files:** Modify `components/guest/blocked-access.tsx`, `app/w/[slug]/layout.tsx`.

- [ ] **Step 1:** Layout passes `contactEmail = story?.contactEmail ?? null` to the blocked and closed/unavailable views. When set, show a `guest-btn` outline "Email the couple" (`mailto:`) and the address as selectable text beneath.
- [ ] **Step 2: Verify** simulated geo block (`x-vercel-ip-country: NG`, allowed `GH`) shows the button. Commit `feat(guest): let blocked or late guests contact the couple`.

### Task C9: Staff-A — denser console

**Files:** Modify `app/super/layout.tsx`, `components/super/nav.tsx`, `components/super/table.tsx`.

- [ ] **Step 1:** Replace the 4xl "Staff console" heading and "Signed in as" paragraph with one compact row: `Staff` chip + the email + role in `text-[13px] text-muted`; remove the unused `Link` import (clears the long-standing lint warning).
- [ ] **Step 2:** Nav sticky (`sticky top-0 z-nav bg-paper/95 backdrop-blur py-2`).
- [ ] **Step 3:** `Table` header text `text-ink font-semibold` (not muted), cells `py-2`, and a `numeric` option on columns via a `numericColumns?: number[]` prop applying `text-right tabular-nums`; use it for money columns on Overview and Payments.
- [ ] **Step 4: Verify** `/super`, `/super/weddings`, `/super/payments` at 1280 and 390. Commit `feat(console): compact header, sticky nav, denser tables`.

### Task C9b: Account-A — password card

**Files:** Modify `app/dashboard/account/page.tsx`.

- [ ] **Step 1:** Under the account form add a `Card` titled "Password" with the text "Change the password you sign in with." and a `Link href="/change-password" className={buttonClass("secondary", "sm")}` "Change password". (The back link to the couple's wedding is already on base.)
- [ ] **Step 2: Verify** the link opens the change-password page while signed in. Commit `feat(account): link to change your password`.

### Task C10: Whole-branch check (recommended)

- [ ] `npx vitest run && npx tsc --noEmit && npm run lint && npm run build`.
- [ ] Walkthrough (local, 1280 + 390 iframe): sign up → onboarding → Overview checklist → Gifts › Registry bank + gift → publish from Overview → guest: When and where + .ics, pinned RSVP (party 3), gift sheet with chips → dashboard: Needs you shows 1 transfer → confirm + undo → Guests: filter chips, edit party size to exceed capacity (refused) → Settings › People.
- [ ] Commit fixes; final review per executing-plans.
