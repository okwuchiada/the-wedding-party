# Vowly Revamp: Shared Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `revamp/base`, the branch holding every revamp change that both `revamp/mine` and `revamp/recommended` share, so each of those branches only adds its differences.

**Architecture:** A semantic-token UI kit (`components/ui/*`) replaces hand-copied Tailwind strings and the olive/burnt-orange remap in the dashboard and staff console. New pure helpers in `lib/` (capacity, guest RSVP rules, transfer references, Nigerian bank accounts, dashboard tabs, setup checklist) carry the logic and get unit tests; components and server actions call them. Guest-site accessibility comes from a scoped CSS baseline plus labelled fields. Source-scan tests stop the old patterns from coming back.

**Tech Stack:** Next.js 16 App Router (read `node_modules/next/dist/docs/` before using any Next API; error boundaries take `unstable_retry`, not `reset`), React 19, Tailwind v4 (`@theme inline` in `app/globals.css`), Prisma 7 + Postgres, Vitest (node environment, `**/*.test.ts` only, so no component rendering tests).

**Spec:** the UI review and option picker from this session: https://claude.ai/artifact/GZjpNwM1KmDkmnjUPTqtmN. Base covers: Global-B, Global-D, Global-F, Landing-A, Pricing-B, Auth-A, Weddings-A, Registry-B+C, Inbox-B, Story-A, Design-A, Wording-A, Settings-B, Billing-A, GuestRSVP-A, GuestWall-A, GuestStates-A, System-A, plus the pieces the two branch plans both need (URL tab state, setup checklist helper, guest nav fixes, party size shown read-only).

## Global Constraints

- Branch `revamp/base` is created from `ui-review` (commit `469a074`). Never commit to `main`, `vowly` or `ui-review`.
- One commit per task. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Local runs: blank `RESEND_API_KEY` and a local Postgres `DATABASE_URL`, never the `.env` Resend key or the shared Neon DB. Run commands as `RESEND_API_KEY= DATABASE_URL=$LOCAL_DATABASE_URL npm run …`.
- Copy: sentence case for headings and buttons, no exclamation marks, plain words ("Add a gift", not "Add Item").
- Money columns use `tabular-nums`. Nigerian account numbers are exactly 10 digits.
- Guest-site text is at least 13px (`text-[13px]`); guest tap targets are at least 44px tall.
- Don't add dependencies. Icons come from `lucide-react`, which is already installed.
- Leave the live legacy wedding and `docs/runbooks/ayodimeji-cutover.md` alone.

## Review Focus

1. A guest RSVPs with no email. Expected: accepted; the duplicate check falls back to a case-insensitive name match, the same as admin entries. Pinned in Task 6.
2. A party of 4 when only 2 seats are left. Expected: rejected with "Only 2 places are left. Please reduce your party size.", not the generic capacity error. Pinned in Task 6 (`capacityError`).
3. An account number with spaces or dashes ("0123 456 789"). Expected: normalised to `0123456789` and accepted, not rejected. Pinned in Task 8.
4. A gift name with no letters ("2025", "🎁"). Expected: the reference falls back to `GIFT-1234`, never an empty prefix. Pinned in Task 7.
5. An unknown or owner-only `?tab=` value (`?tab=billing` for an editor). Expected: falls back to the first tab instead of rendering nothing. Pinned in Task 9.

---

## File map

| Path | Responsibility |
|---|---|
| `components/marketing/brand.ts` | Brand tokens + semantic tokens on `BRAND_STYLE`; the olive/burnt-orange remap is removed at the end of Task 4 |
| `app/globals.css` | `@theme inline` colour names for semantic tokens, z-index scale, guest focus baseline |
| `components/ui/button.tsx` | `Button`, `buttonClass()` |
| `components/ui/field.tsx` | `Field`, `inputClass`, `TextInput`, `SelectInput`, `TextArea` |
| `components/ui/section-heading.tsx` | `SectionHeading` |
| `components/ui/card.tsx` | `Card` |
| `components/ui/table.tsx` | `TableShell`, `Th`, `Td` |
| `components/ui/empty-state.tsx` | `EmptyState` |
| `components/ui/notice.tsx` | `Notice` |
| `components/ui/segmented.tsx` | `Segmented` (Pending / Approved / Hidden switch) |
| `components/ui/toast.tsx` | `ToastProvider`, `useToast` |
| `lib/ui-guards.test.ts` | Source-scan tests: no legacy tokens in platform UI, no bare `outline-none` on guest fields |
| `lib/capacity.ts` | `guestCapacity`, `seatsLeft` |
| `lib/rsvp-rules.ts` | `parseGuestRsvp`, `MAX_PARTY_SIZE` |
| `lib/transfer-reference.ts` | `transferReference`, `isTransferReference` |
| `lib/bank-account.ts` | `NG_BANKS`, `normaliseAccountNumber`, `bankDetailsError` |
| `lib/dashboard-tabs.ts` | `DASHBOARD_TABS`, `tabFromParam` |
| `lib/setup-checklist.ts` | `setupSteps` (consumed by both branch plans) |
| `lib/nav-date.ts` | `formatNavDate` (day-first) |
| `prisma/migrations/20261010100000_contribution_reference/` | `Contribution.reference` column |
| `app/not-found.tsx`, `app/error.tsx`, `app/w/[slug]/not-found.tsx`, `app/w/[slug]/[...rest]/page.tsx` | 404 and error pages |

---

### Task 1: Semantic tokens

**Files:**
- Modify: `components/marketing/brand.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: Tailwind colour names `action`, `action-ink`, `danger`, `success`, `warning`, `surface`, `surface-muted`, `line`, `muted`, `ink`, `paper`; z-index utilities `z-nav` (40), `z-overlay` (80), `z-toast` (90), `z-banner` (95). Every later task uses these names.

- [ ] **Step 1: Create the branch**

```bash
git switch ui-review && git switch -c revamp/base
```

- [ ] **Step 2: Add semantic tokens to `BRAND_STYLE`**

In `components/marketing/brand.ts`, add these keys to the `BRAND_STYLE` object, above the existing `--background` line (keep the remap for now; Task 4 removes it):

```ts
  // Semantic tokens for platform UI (components/ui). Prefer these over brand names.
  "--action": BRAND.gold,
  "--action-ink": BRAND.ink,
  "--danger": BRAND.coralDeep,
  "--success": BRAND.emerald,
  "--warning": "#8a5a00",
  "--surface": "#ffffff",
  "--surface-muted": "#eceff6",
  "--line": BRAND.mist,
  "--muted": "#5a6285",
```

`#5a6285` on white is 6.0:1 and `#8a5a00` on white is 6.4:1, so both pass WCAG AA for small text.

- [ ] **Step 3: Register the tokens and z-index scale in `app/globals.css`**

Inside the existing `@theme inline { … }` block, add:

```css
  --color-action: var(--action);
  --color-action-ink: var(--action-ink);
  --color-danger: var(--danger);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-line: var(--line);
  --color-muted: var(--muted);
  --color-ink: var(--m-ink);
  --color-paper: var(--m-paper);
  --z-index-nav: 40;
  --z-index-overlay: 80;
  --z-index-toast: 90;
  --z-index-banner: 95;
```

Replace the `body` rule's `font-family: Arial, Helvetica, sans-serif;` with `font-family: var(--sans, system-ui), system-ui, sans-serif;`, so pages outside a brand or theme wrapper stop falling back to Arial.

Delete the commented-out dark-mode block (`/* @media (prefers-color-scheme: dark) … */`).

- [ ] **Step 4: Verify the tokens compile**

Run: `npm run build`
Expected: build succeeds with no CSS errors. (No class uses the new names yet; Task 2 is the first.)

- [ ] **Step 5: Commit**

```bash
git add components/marketing/brand.ts app/globals.css
git commit -m "feat(ui): add semantic colour tokens and z-index scale"
```

---

### Task 2: UI kit

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/field.tsx`, `components/ui/section-heading.tsx`, `components/ui/card.tsx`, `components/ui/table.tsx`, `components/ui/empty-state.tsx`, `components/ui/notice.tsx`, `components/ui/segmented.tsx`

**Interfaces:**
- Consumes: Task 1 colour names.
- Produces (exact):
  - `buttonClass(variant?: "primary" | "secondary" | "text" | "danger" | "inverse", size?: "sm" | "md" | "lg"): string`
  - `Button(props: ButtonHTMLAttributes & { variant?; size?; pending?: boolean; pendingLabel?: string })`
  - `inputClass: string`; `Field({ label, hint?, error?, htmlFor?, children })`; `TextInput`, `SelectInput`, `TextArea` (native props + `label`, `hint?`, `error?`)
  - `SectionHeading({ title, description?, action?, as?: "h2" | "h3" })`
  - `Card({ children, className?, as? })`
  - `TableShell({ children, minWidth?: string })`, `Th`, `Td` (with `numeric?: boolean`)
  - `EmptyState({ title, body?, action? })`
  - `Notice({ tone: "info" | "success" | "error" | "warning", children, action? })`
  - `Segmented<T extends string>({ label, options: { value: T; label: string; count?: number }[], value: T, onChange(v: T) })`

- [ ] **Step 1: Write `components/ui/button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "text" | "danger" | "inverse";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-action text-action-ink hover:bg-ink hover:text-paper",
  secondary: "border border-ink/25 text-ink hover:border-ink",
  text: "text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink",
  danger: "bg-danger text-white hover:bg-danger/85",
  inverse: "bg-ink text-paper hover:bg-success",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-[13px]",
  md: "min-h-10 px-5 text-sm",
  lg: "min-h-12 px-6 text-sm",
};

/** Class string for a button-styled element; use on <Link> and <a> too. */
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  const shape = variant === "text" ? "px-0 min-h-0" : `rounded-full ${SIZES[size]}`;
  return `inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none ${shape} ${VARIANTS[variant]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  pending = false,
  pendingLabel,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; pending?: boolean; pendingLabel?: string }) {
  return (
    <button type={type} disabled={pending || props.disabled} className={`${buttonClass(variant, size)} ${className}`} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
```

- [ ] **Step 2: Write `components/ui/field.tsx`**

```tsx
import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-[6px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition-shadow focus-visible:border-ink/50 focus-visible:ring-3 focus-visible:ring-action/35 focus-visible:outline-none aria-invalid:border-danger";

type Meta = { label: string; hint?: string; error?: string };

/** Label above, hint or error below, all wired to the control with aria attributes. */
export function Field({ label, hint, error, htmlFor, children }: Meta & { htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, meta: Meta) {
  return meta.error ? `${id}-error` : meta.hint ? `${id}-hint` : undefined;
}

export function TextInput({ label, hint, error, id, className = "", ...props }: Meta & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <input id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} className={`${inputClass} ${className}`} {...props} />
    </Field>
  );
}

export function SelectInput({ label, hint, error, id, className = "", children, ...props }: Meta & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <select id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} className={`${inputClass} ${className}`} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function TextArea({ label, hint, error, id, className = "", ...props }: Meta & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <textarea id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { label, hint, error })} className={`${inputClass} ${className}`} {...props} />
    </Field>
  );
}
```

- [ ] **Step 3: Write the remaining parts**

`components/ui/section-heading.tsx`:

```tsx
export function SectionHeading({
  title,
  description,
  action,
  as: Tag = "h2",
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Tag className={`font-(family-name:--m-display) font-bold tracking-tight text-ink ${Tag === "h2" ? "text-2xl" : "text-lg"}`}>{title}</Tag>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
```

`components/ui/card.tsx`:

```tsx
export function Card({ children, className = "", as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={`rounded-[8px] border border-line bg-surface p-5 ${className}`}>{children}</Tag>;
}
```

`components/ui/table.tsx`:

```tsx
export function TableShell({ children, minWidth = "min-w-150" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-line bg-surface">
      <table className={`w-full ${minWidth} text-left text-sm`}>{children}</table>
    </div>
  );
}

export function Th({ children, numeric = false }: { children?: React.ReactNode; numeric?: boolean }) {
  return <th scope="col" className={`border-b border-line px-4 py-3 text-[13px] font-semibold text-muted ${numeric ? "text-right" : ""}`}>{children}</th>;
}

export function Td({ children, numeric = false, className = "" }: { children?: React.ReactNode; numeric?: boolean; className?: string }) {
  return <td className={`border-b border-line px-4 py-3 align-middle text-ink ${numeric ? "text-right tabular-nums" : ""} ${className}`}>{children}</td>;
}
```

`components/ui/empty-state.tsx`:

```tsx
export function EmptyState({ title, body, action }: { title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[8px] border border-dashed border-ink/20 bg-surface px-6 py-10 text-center">
      <p className="font-(family-name:--m-display) text-lg font-bold text-ink">{title}</p>
      {body && <p className="max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

`components/ui/notice.tsx`:

```tsx
const TONES = {
  info: "bg-surface-muted text-ink",
  success: "bg-success/10 text-success",
  error: "bg-danger/10 text-danger",
  warning: "bg-action/20 text-warning",
} as const;

export function Notice({ tone = "info", children, action }: { tone?: keyof typeof TONES; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex flex-wrap items-center justify-between gap-3 rounded-[6px] px-4 py-3 text-sm font-medium ${TONES[tone]}`}>
      <div className="min-w-0">{children}</div>
      {action}
    </div>
  );
}
```

`components/ui/segmented.tsx`:

```tsx
"use client";

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              on ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className="ml-1.5 tabular-nums opacity-75">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. (Nothing imports the kit yet.)

- [ ] **Step 5: Commit**

```bash
git add components/ui
git commit -m "feat(ui): add shared button, field, table, notice and heading parts"
```

---

### Task 3: Move shared admin and staff parts onto the kit

**Files:**
- Modify: `components/admin/confirm-modal.tsx`, `components/admin/pagination.tsx`, `components/admin/accordion.tsx`, `components/admin/dashboard-bar.tsx`, `components/admin/staff-banner.tsx`, `components/admin/impersonation-banner.tsx`
- Modify: every file in `components/super/*.tsx`
- Modify: `components/auth/legal-modal.tsx`

**Interfaces:**
- Consumes: Task 2 kit.
- Produces: `ConfirmModal` with a focus trap and focus returned to the opener; same props as today.

- [ ] **Step 1: Rewrite `confirm-modal.tsx`'s dialog body**

Replace the two footer buttons with the kit, and add focus trap plus focus return. The component keeps its props. New body:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = { title: string; description?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };

export default function ConfirmModal({
  open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = true, onConfirm, onCancel,
}: ConfirmOptions & { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="fixed inset-0 z-overlay flex items-center justify-center bg-ink/40 px-4" onClick={onCancel}>
      <div ref={panelRef} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-[8px] border border-line bg-surface p-6">
        <h2 id="confirm-modal-title" className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "inverse"} size="sm" onClick={onConfirm} autoFocus>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Apply the same focus trap to `components/auth/legal-modal.tsx`**

Copy the `panelRef` + `useEffect` pattern from Step 1 (keyed on `doc` instead of `open`), change `z-100` to `z-overlay`, and swap its Close button for `<Button variant="inverse" size="sm" onClick={onClose} autoFocus>Close</Button>`.

- [ ] **Step 3: Pagination, accordion, bars**

- `components/admin/pagination.tsx`: page-size `<select>` gets `className={\`${inputClass} w-auto py-1.5 text-[13px]\`}` and an `aria-label="Rows per page"`; Previous, Next and number buttons get `className="min-h-9 min-w-9 rounded-full px-2 text-[13px] hover:bg-surface-muted aria-[current=page]:bg-ink aria-[current=page]:text-paper disabled:opacity-40"`; replace `text-foreground/70` with `text-muted` and `hover:text-burnt-orange` with nothing (the background hover replaces it).
- `components/admin/accordion.tsx`: `border-(--m-mist)` → `border-line`, `bg-white` → `bg-surface`, `text-(--m-ink)/60` → `text-muted`, `text-(--m-coral-deep)` → `text-danger`, `focus-visible:outline-(--m-ink)` → `focus-visible:outline-ink`.
- `components/admin/dashboard-bar.tsx`: delete the commented-out links block; Sign out becomes `<button type="submit" className={buttonClass("secondary", "sm")}>Sign out</button>`; the profile link uses `buttonClass("text")`.
- `staff-banner.tsx`, `impersonation-banner.tsx`: replace legacy colour classes per the mapping table in Task 4 and use `z-banner` for any fixed positioning.

- [ ] **Step 4: Staff console parts**

In each `components/super/*.tsx`: replace `bg-white` → `bg-surface`, `text-foreground/55` / `text-foreground/60` → `text-muted`, `hover:text-burnt-orange` → `hover:underline`, legacy colours per the Task 4 mapping. `components/super/table.tsx` becomes a thin wrapper over `TableShell`/`Th` (keep its `Table({ head, children })` signature and its `date` export):

```tsx
import { TableShell, Th } from "@/components/ui/table";

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <TableShell minWidth="min-w-0">
      <thead><tr>{head.map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
      <tbody className="align-top">{children}</tbody>
    </TableShell>
  );
}

export const date = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");
```

Action buttons in `action-button.tsx`, `mark-paid-button.tsx`, forms in `comp-form.tsx`, `domain-form.tsx`, `note-form.tsx`, `plan-form.tsx`, `staff-forms.tsx`, `staff-profile-form.tsx`, `search-form.tsx`: submit buttons use `buttonClass("primary", "sm")`, destructive ones `buttonClass("danger", "sm")`, inputs use `inputClass`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass. Then `npm run dev`, sign in as a staff user, open `/super/weddings/<id>`, trigger "Suspend" and check: Tab cycles only inside the dialog, Escape closes it, and focus returns to the Suspend button.

- [ ] **Step 6: Commit**

```bash
git add components/admin components/super components/auth/legal-modal.tsx
git commit -m "refactor(ui): move shared admin and staff parts onto the UI kit"
```

---

### Task 4: Move every dashboard tab onto the kit, remove the remap, add the guard

**Files:**
- Modify: `components/admin/{registry-tab,rsvp-tab,story-tab,story-beats-section,contributions-tab,media-tab,wishes-tab,members-tab,settings-tab,wording-tab,billing-tab,design-tab,layout-picker,category-field,country-picker,account-form,create-wedding-form,home}.tsx`
- Modify: `app/super/**/*.tsx`, `app/dashboard/**/*.tsx`
- Modify: `components/marketing/brand.ts` (remove remap)
- Create: `lib/ui-guards.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: `lib/ui-guards.test.ts` with `LEGACY_TOKEN` regex; later tasks must keep it passing.

Mapping (apply everywhere in the files above):

| Old | New |
|---|---|
| `text-burnt-orange` (error text) | `text-danger` |
| `hover:text-burnt-orange` | `hover:text-ink hover:underline` |
| `text-olive` (success text) | `text-success` |
| `bg-olive/10` | `bg-success/10` |
| `bg-ivory` | `bg-surface-muted` |
| `bg-cream` | `bg-surface-muted` |
| `text-ivory` / `file:text-ivory` | `text-paper` / `file:text-paper` |
| `focus-within:border-olive` | `focus-within:border-ink/50` |
| `border-(--m-mist)` | `border-line` |
| `bg-white` | `bg-surface` |
| `text-foreground` | `text-ink` |
| `text-foreground/50`, `/55`, `/60`, `/70` | `text-muted` |
| `border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none` (and `inputClass`/`fieldClass` locals with that value) | `inputClass` from `@/components/ui/field` |
| `<label className="flex flex-col gap-1.5 text-xs text-foreground/60">Label<input …/></label>` | `<TextInput label="Label" … />` (or `SelectInput` / `TextArea`) |
| gold pill button strings | `buttonClass("primary", "sm")` or `<Button size="sm">` |
| outline pill button strings | `buttonClass("secondary", "sm")` |
| `text-xs text-foreground/60 hover:text-burnt-orange` row actions | `<Button variant="text" size="sm">` |
| Title Case headings ("Pending Contributions", "Registry Items", "Bank Details", "Story Photos", "Bulk Upload", "Add Item", "Save Changes", "Gallery Wall", "Approved Media", "Hidden Media") | Sentence case ("Pending contributions", "Registry items", "Bank details", "Story photos", "Upload several", "Add a gift", "Save changes", "Photo wall", "Approved photos", "Hidden photos") |
| `<h2 className="… font-(family-name:--m-display) font-bold tracking-tight text-2xl …">X</h2>` + sibling action | `<SectionHeading title="X" action={…} />` |
| tables `<div className="overflow-x-auto rounded-[6px] border …"><table …>` | `<TableShell>`, headers `<Th>`, money cells `<Td numeric>` |
| `<p className="text-sm text-foreground/60">No … yet.</p>` empty lists | `<EmptyState title="…" body="…" />` |
| `{state?.error && <p className="text-xs text-burnt-orange">…` | `{state?.error && <Notice tone="error">{state.error}</Notice>}` |
| square unpublish/gallery toggle buttons | `buttonClass("secondary", "sm")` |

- [ ] **Step 1: Write the guard test (it fails now)**

`lib/ui-guards.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const rel = join(dir, name);
    return statSync(join(ROOT, rel)).isDirectory() ? files(rel) : rel.endsWith(".tsx") ? [rel] : [];
  });
}

/** Theme-remap colour classes that the platform UI must not use; guest-site code still may. */
export const LEGACY_TOKEN = /\b(?:text|bg|border|ring|from|via|to|file:text|hover:text|hover:bg|hover:border|focus-within:border)-(?:burnt-orange|olive|ivory|cream)(?:-dark)?\b/;

const PLATFORM_DIRS = ["components/admin", "components/super", "app/dashboard", "app/super"];

describe("platform UI", () => {
  it("uses semantic tokens, not the theme remap", () => {
    const offenders = PLATFORM_DIRS.flatMap(files).filter((f) => LEGACY_TOKEN.test(readFileSync(join(ROOT, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to see the offenders**

Run: `npx vitest run lib/ui-guards.test.ts`
Expected: FAIL, listing about 20 files.

- [ ] **Step 3: Migrate the files, one or two at a time, using the mapping table**

Work through the Files list. After each file, run `npx tsc --noEmit`. Keep every existing prop, handler and server-action call unchanged; this step only changes markup and classes. Worked example from `registry-tab.tsx`'s bank-details form, replacing the five hand-written label+input blocks:

```tsx
<form action={formAction} className="grid grid-cols-1 gap-4 rounded-[8px] bg-surface-muted p-4 sm:grid-cols-2">
  <TextInput label="Account name" name="name" defaultValue={bankDetails.name} autoComplete="off" />
  <TextInput label="Bank" name="bank" defaultValue={bankDetails.bank} />
  <TextInput label="Account number" name="account" defaultValue={bankDetails.account} inputMode="numeric" />
  <TextInput label="SWIFT / BIC (optional)" name="swift" defaultValue={bankDetails.swift ?? ""} />
  {state?.error && <div className="sm:col-span-2"><Notice tone="error">{state.error}</Notice></div>}
  <div className="flex gap-2 sm:col-span-2">
    <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
    <Button type="submit" size="sm" pending={pending} pendingLabel="Saving…">Save</Button>
  </div>
</form>
```

(The routing field is dropped here and in Task 8; `saveBankDetails` already stores `""` when it's missing.)

- [ ] **Step 4: Remove the remap from `BRAND_STYLE`**

In `components/marketing/brand.ts`, delete the `--olive`, `--olive-dark`, `--burnt-orange`, `--burnt-orange-dark`, `--ivory`, `--cream` and `--ink` keys and update the doc comment to: `/** Brand tokens plus semantic tokens (components/ui). Guest sites set their own theme variables. */`. Keep `--background`, `--foreground`, `--serif`, `--sans`.

- [ ] **Step 5: Run the guard and the full suite**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass, including `platform UI › uses semantic tokens`.

- [ ] **Step 6: Visual pass**

`npm run dev`, then open every dashboard tab and `/super/*` page at 1280px and 390px widths. Check: no unstyled (browser-default) inputs, buttons are all pills, headings are sentence case, focus rings show on Tab. Fix anything found before committing.

- [ ] **Step 7: Commit**

```bash
git add components app lib/ui-guards.test.ts
git commit -m "refactor(ui): move dashboard and console onto semantic tokens and guard against the old remap"
```

---

### Task 5: Toasts (Global-F)

**Files:**
- Create: `components/ui/toast.tsx`
- Modify: `app/dashboard/layout.tsx`, `app/super/layout.tsx`
- Modify: `components/admin/{settings-tab,wording-tab,design-tab,story-tab,members-tab,account-form}.tsx` (the "Saved." lines)

**Interfaces:**
- Produces: `ToastProvider({ children })`; `useToast(): (t: { message: string; tone?: "success" | "error"; undo?: () => Promise<void> }) => void`. Inbox-B (Task 11) and both branch plans call `useToast`.

- [ ] **Step 1: Write `components/ui/toast.tsx`**

```tsx
"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error"; undo?: () => Promise<void> };
type Show = (t: { message: string; tone?: Toast["tone"]; undo?: () => Promise<void> }) => void;

const ToastContext = createContext<Show>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const DURATION_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback<Show>(({ message, tone = "success", undo }) => {
    const id = nextId.current++;
    setToasts((all) => [...all.slice(-2), { id, message, tone, undo }]);
    setTimeout(() => dismiss(id), DURATION_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-toast flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-medium shadow-[0_16px_32px_-16px_rgb(22_32_74/0.6)] ${t.tone === "error" ? "bg-danger text-white" : "bg-ink text-paper"}`}
          >
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.undo && (
              <button type="button" onClick={async () => { dismiss(t.id); await t.undo!(); }} className="font-semibold text-action underline underline-offset-4">
                Undo
              </button>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="-mr-1 px-1 opacity-70 hover:opacity-100">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 2: Mount it**

Wrap the children in `app/dashboard/layout.tsx` and `app/super/layout.tsx` with `<ToastProvider>`.

- [ ] **Step 3: Replace inline "Saved." lines**

In each form listed, remove `{state?.success && <p …>Saved.</p>}` and add, inside the component:

```tsx
const toast = useToast();
useEffect(() => {
  if (state?.success) toast({ message: "Saved" });
}, [state, toast]);
```

Use the specific message per form: "Settings saved", "Wording saved", "Design saved", "Story saved", "Invite sent" (members, when `state.message` is set, use `state.message`), "Account saved". Errors stay inline as `<Notice tone="error">` next to the field or form.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`. In `npm run dev`, save the Wording tab: one toast appears bottom-right on desktop and full-width at the bottom on a 390px viewport, and disappears after about 6 seconds.

- [ ] **Step 5: Commit**

```bash
git add components/ui/toast.tsx app/dashboard/layout.tsx app/super/layout.tsx components/admin
git commit -m "feat(ui): add toast messages for saves across the dashboard"
```

---

### Task 6: Guest capacity and RSVP rules

**Files:**
- Create: `lib/capacity.ts`, `lib/capacity.test.ts`, `lib/rsvp-rules.ts`, `lib/rsvp-rules.test.ts`
- Modify: `lib/actions/rsvp.ts` (`submitRsvp`)
- Modify: `app/dashboard/[weddingId]/page.tsx`, `components/admin/rsvp-tab.tsx`

**Interfaces:**
- Produces:
  - `guestCapacity(weddingMax: number, planMax: number | null | undefined): number`
  - `seatsLeft(capacity: number, taken: number): number`
  - `capacityError(partySize: number, left: number): string | null`
  - `MAX_PARTY_SIZE = 10`
  - `parseGuestRsvp(input: { name: unknown; email: unknown; attending: unknown; partySize: unknown; message: unknown }): { error: string } | { data: { guestName: string; email: string; attending: boolean; guestCount: number; message: string | null } }`
  - `RsvpTab` gains a `capacity: number` prop.

- [ ] **Step 1: Failing tests**

`lib/capacity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { capacityError, guestCapacity, seatsLeft } from "@/lib/capacity";

describe("guestCapacity", () => {
  it("uses the smaller of the wedding's and the plan's limit", () => {
    expect(guestCapacity(300, 500)).toBe(300);
    expect(guestCapacity(300, 100)).toBe(100);
  });
  it("uses the wedding's limit when there's no plan", () => {
    expect(guestCapacity(120, null)).toBe(120);
  });
});

describe("seatsLeft", () => {
  it("never goes below zero", () => {
    expect(seatsLeft(100, 98)).toBe(2);
    expect(seatsLeft(100, 130)).toBe(0);
  });
});

describe("capacityError", () => {
  it("allows a party that fits", () => {
    expect(capacityError(2, 2)).toBeNull();
  });
  it("says how many places are left when the party is too big", () => {
    expect(capacityError(4, 2)).toBe("Only 2 places are left. Please reduce your party size.");
    expect(capacityError(3, 1)).toBe("Only 1 place is left. Please reduce your party size.");
  });
  it("says the wedding is full when nothing is left", () => {
    expect(capacityError(1, 0)).toBe("Sorry, we've reached full capacity and can no longer accept RSVPs.");
  });
});
```

`lib/rsvp-rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MAX_PARTY_SIZE, parseGuestRsvp } from "@/lib/rsvp-rules";

const base = { name: "Ngozi Adeyemi", email: "ngozi@example.com", attending: "yes", partySize: "2", message: "" };

describe("parseGuestRsvp", () => {
  it("accepts a full reply", () => {
    expect(parseGuestRsvp(base)).toEqual({
      data: { guestName: "Ngozi Adeyemi", email: "ngozi@example.com", attending: true, guestCount: 2, message: null },
    });
  });
  it("accepts a reply with no email", () => {
    const result = parseGuestRsvp({ ...base, email: "" });
    expect("data" in result && result.data.email).toBe("");
  });
  it("rejects a malformed email", () => {
    expect(parseGuestRsvp({ ...base, email: "ngozi@" })).toEqual({ error: "Please check your email address" });
  });
  it("needs a name", () => {
    expect(parseGuestRsvp({ ...base, name: "  " })).toEqual({ error: "Please enter your name" });
  });
  it("needs a yes or no", () => {
    expect(parseGuestRsvp({ ...base, attending: null })).toEqual({ error: "Please let us know if you can make it" });
  });
  it("keeps party size between 1 and the maximum", () => {
    expect(parseGuestRsvp({ ...base, partySize: "0" })).toEqual({ error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` });
    expect(parseGuestRsvp({ ...base, partySize: String(MAX_PARTY_SIZE + 1) })).toEqual({ error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` });
  });
  it("counts a decline as one reply regardless of party size", () => {
    const result = parseGuestRsvp({ ...base, attending: "no", partySize: "5" });
    expect("data" in result && result.data.guestCount).toBe(1);
  });
  it("defaults a missing party size to 1", () => {
    const result = parseGuestRsvp({ ...base, partySize: null });
    expect("data" in result && result.data.guestCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/capacity.test.ts lib/rsvp-rules.test.ts`
Expected: FAIL, "Failed to resolve import".

- [ ] **Step 3: Implement**

`lib/capacity.ts`:

```ts
/** Most guests who can attend: the couple's own limit, capped by their plan's. */
export function guestCapacity(weddingMax: number, planMax: number | null | undefined) {
  return Math.min(weddingMax, planMax ?? weddingMax);
}

export function seatsLeft(capacity: number, taken: number) {
  return Math.max(0, capacity - taken);
}

/** Why a party can't be seated, or null if it fits. */
export function capacityError(partySize: number, left: number) {
  if (left <= 0) return "Sorry, we've reached full capacity and can no longer accept RSVPs.";
  if (partySize > left) return `Only ${left} ${left === 1 ? "place is" : "places are"} left. Please reduce your party size.`;
  return null;
}
```

`lib/rsvp-rules.ts`:

```ts
export const MAX_PARTY_SIZE = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Input = { name: unknown; email: unknown; attending: unknown; partySize: unknown; message: unknown };
type Data = { guestName: string; email: string; attending: boolean; guestCount: number; message: string | null };

/** Validates a guest's RSVP form. Email is optional; declines always count as one reply. */
export function parseGuestRsvp(input: Input): { error: string } | { data: Data } {
  const guestName = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!guestName) return { error: "Please enter your name" };

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (email && !EMAIL_REGEX.test(email)) return { error: "Please check your email address" };

  if (input.attending !== "yes" && input.attending !== "no") return { error: "Please let us know if you can make it" };
  const attending = input.attending === "yes";

  const raw = typeof input.partySize === "string" && input.partySize.trim() ? Number(input.partySize) : 1;
  if (!Number.isInteger(raw) || raw < 1 || raw > MAX_PARTY_SIZE) return { error: `Party size must be between 1 and ${MAX_PARTY_SIZE}` };

  const message = typeof input.message === "string" ? input.message.trim() : "";
  return { data: { guestName, email, attending, guestCount: attending ? raw : 1, message: message || null } };
}
```

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run lib/capacity.test.ts lib/rsvp-rules.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Use them in `submitRsvp`**

In `lib/actions/rsvp.ts`, replace everything from `const email = formData.get("email");` through the `db.rsvp.create` call with:

```ts
  const parsed = parseGuestRsvp({
    name: formData.get("name"),
    email: formData.get("email"),
    attending: attendingRaw,
    partySize: formData.get("partySize"),
    message: formData.get("message"),
  });
  if ("error" in parsed) return { error: parsed.error };
  const { guestName, email, attending, guestCount, message } = parsed.data;

  const duplicate = email
    ? await findRsvpByEmail(db, email)
    : await db.rsvp.findFirst({
        where: { weddingId: wedding.id, guestName: { equals: guestName, mode: "insensitive" } },
        select: { id: true },
      });
  if (duplicate) {
    return { error: "We already have an RSVP under this name or email. Please contact the couple to change it." };
  }

  if (attending) {
    const { _sum } = await db.rsvp.aggregate({
      where: { weddingId: wedding.id, attending: true },
      _sum: { guestCount: true },
    });
    const left = seatsLeft(guestCapacity(wedding.maxGuests, wedding.plan?.maxGuests), _sum.guestCount ?? 0);
    const full = capacityError(guestCount, left);
    if (full) return { error: full };
  }

  await db.rsvp.create({
    data: { weddingId: wedding.id, guestName, email, attending, guestCount, message, ipAddress: ip, userAgent },
  });

  revalidateDashboard(wedding);
  return { success: true, guestName: guestName.split(" ")[0], attending };
```

Also: the honeypot branch reads `formData.get("name")` instead of `firstName`; delete the `firstName`/`lastName` reads and the `EMAIL_REGEX` constant if nothing else uses it (the admin validator still does, so keep it). Add imports for `parseGuestRsvp`, `guestCapacity`, `seatsLeft`, `capacityError`.

Note: until Task 21 changes the guest form's field names, the old form still posts `firstName`/`lastName`. Tasks 6 and 21 must land in the same pull request; do not deploy between them.

- [ ] **Step 6: Pass capacity to the RSVP tab and show party size read-only**

In `app/dashboard/[weddingId]/page.tsx`, pass `capacity={guestCapacity(wedding.maxGuests, wedding.plan?.maxGuests)}` through `AdminHome` to `RsvpTab` (add `capacity: number` to both prop types). In `rsvp-tab.tsx`, replace `/ 100` with `/ {capacity}` and rename the "Guests" column header to "Party". The admin form still doesn't edit party size (RSVPs-C in the recommended plan adds that).

- [ ] **Step 7: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: PASS.

```bash
git add lib/capacity.ts lib/capacity.test.ts lib/rsvp-rules.ts lib/rsvp-rules.test.ts lib/actions/rsvp.ts app/dashboard components/admin
git commit -m "feat(rsvp): party sizes, optional email and real capacity"
```

---

### Task 7: Unique transfer references

**Files:**
- Create: `lib/transfer-reference.ts`, `lib/transfer-reference.test.ts`
- Create: `prisma/migrations/20261010100000_contribution_reference/migration.sql`
- Modify: `prisma/schema.prisma` (`Contribution`), `lib/actions/contributions.ts`, `lib/types.ts`, `app/dashboard/[weddingId]/page.tsx`, `components/admin/contributions-tab.tsx`

**Interfaces:**
- Produces: `transferReference(itemName: string, random?: () => number): string` (format `ABCDE-1234`); `isTransferReference(value: string): boolean`; `submitContribution` accepts an optional `reference` form field; `PendingContributionView` and `ConfirmedContributionView` gain `reference: string | null`. Both gift options (GuestGift-A and GuestGift-B) call `transferReference`.

- [ ] **Step 1: Failing test**

`lib/transfer-reference.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isTransferReference, transferReference } from "@/lib/transfer-reference";

const fixed = (n: number) => () => n;

describe("transferReference", () => {
  it("uses up to five letters of the gift's first word", () => {
    expect(transferReference("Honeymoon fund", fixed(0.4827))).toBe("HONEY-4827");
    expect(transferReference("TV", fixed(0.0005))).toBe("TV-0005");
  });
  it("falls back to GIFT when the name has no letters", () => {
    expect(transferReference("2025", fixed(0.1))).toBe("GIFT-1000");
    expect(transferReference("🎁", fixed(0.1))).toBe("GIFT-1000");
  });
  it("drops accents", () => {
    expect(transferReference("Éclair set", fixed(0.1234))).toBe("ECLAI-1234");
  });
  it("always has four digits", () => {
    expect(transferReference("Fridge", fixed(0.9999))).toBe("FRIDG-9999");
  });
});

describe("isTransferReference", () => {
  it("accepts generated references only", () => {
    expect(isTransferReference("HONEY-4827")).toBe(true);
    expect(isTransferReference("honey-4827")).toBe(false);
    expect(isTransferReference("HONEY-48")).toBe(false);
    expect(isTransferReference("HONEYMOON-4827")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/transfer-reference.test.ts`
Expected: FAIL, import can't be resolved.

- [ ] **Step 3: Implement**

`lib/transfer-reference.ts`:

```ts
const PATTERN = /^[A-Z]{1,5}-\d{4}$/;

/**
 * A short reference a guest puts on their bank transfer, so the couple can match
 * it to one guest: up to five letters from the gift's name and four digits.
 */
export function transferReference(itemName: string, random: () => number = Math.random) {
  const letters = itemName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .match(/[A-Z]+/);
  const prefix = letters ? letters[0].slice(0, 5) : "GIFT";
  const digits = String(Math.floor(random() * 10_000)).padStart(4, "0");
  return `${prefix}-${digits}`;
}

export function isTransferReference(value: string) {
  return PATTERN.test(value);
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/transfer-reference.test.ts`
Expected: PASS.

- [ ] **Step 5: Schema and migration**

In `prisma/schema.prisma`, add to `model Contribution` after `note`:

```prisma
  // What the guest put on their bank transfer, e.g. "HONEY-4827".
  reference      String?
```

`prisma/migrations/20261010100000_contribution_reference/migration.sql`:

```sql
ALTER TABLE "Contribution" ADD COLUMN "reference" TEXT;
```

Run: `DATABASE_URL=$LOCAL_DATABASE_URL npx prisma migrate dev --skip-seed` then `npx prisma generate`.
Expected: migration applied to the local database only.

- [ ] **Step 6: Accept and show the reference**

In `submitContribution`, after the amount check:

```ts
  const referenceRaw = formData.get("reference");
  const reference = typeof referenceRaw === "string" && isTransferReference(referenceRaw) ? referenceRaw : null;
```

and add `reference` to the `db.contribution.create` data. Pass `reference: c.reference` in both contribution mappings in `app/dashboard/[weddingId]/page.tsx`, add `reference: string | null` to both view types in `lib/types.ts`, and add a "Reference" column (`<Td className="font-(family-name:--font-mono) text-[13px]">{c.reference ?? "—"}</Td>`) to both tables in `contributions-tab.tsx`. `home.tsx`'s `handleConfirmContribution` copies `reference` into the confirmed row.

- [ ] **Step 7: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`

```bash
git add lib/transfer-reference.ts lib/transfer-reference.test.ts prisma lib/actions/contributions.ts lib/types.ts app/dashboard components/admin
git commit -m "feat(gifts): give each transfer its own reference"
```

---

### Task 8: Nigerian bank details (Registry-C, logic)

**Files:**
- Create: `lib/bank-account.ts`, `lib/bank-account.test.ts`
- Modify: `lib/actions/bank-details.ts`

**Interfaces:**
- Produces: `NG_BANKS: readonly string[]`; `normaliseAccountNumber(raw: string): string`; `bankDetailsError(input: { currency: string; name: string; bank: string; account: string }): string | null`. Task 10 renders the bank dropdown from `NG_BANKS`.

- [ ] **Step 1: Failing test**

`lib/bank-account.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bankDetailsError, NG_BANKS, normaliseAccountNumber } from "@/lib/bank-account";

const ok = { currency: "NGN", name: "Ifeoma Okafor", bank: "Access Bank", account: "0123456789" };

describe("normaliseAccountNumber", () => {
  it("strips spaces and dashes", () => {
    expect(normaliseAccountNumber(" 0123 456-789 ")).toBe("0123456789");
  });
});

describe("bankDetailsError", () => {
  it("accepts a 10-digit naira account", () => {
    expect(bankDetailsError(ok)).toBeNull();
  });
  it("accepts spaced digits once normalised", () => {
    expect(bankDetailsError({ ...ok, account: "0123 456 789" })).toBeNull();
  });
  it("rejects a naira account that isn't 10 digits", () => {
    expect(bankDetailsError({ ...ok, account: "12345" })).toBe("Nigerian account numbers have 10 digits");
    expect(bankDetailsError({ ...ok, account: "01234567AB" })).toBe("Nigerian account numbers have 10 digits");
  });
  it("allows other formats for other currencies", () => {
    expect(bankDetailsError({ ...ok, currency: "GBP", account: "GB29 NWBK 6016 1331 9268 19" })).toBeNull();
  });
  it("needs a name and a bank", () => {
    expect(bankDetailsError({ ...ok, name: " " })).toBe("Account name is required");
    expect(bankDetailsError({ ...ok, bank: "" })).toBe("Choose your bank");
  });
});

describe("NG_BANKS", () => {
  it("is sorted and has no duplicates", () => {
    expect([...NG_BANKS].sort((a, b) => a.localeCompare(b))).toEqual([...NG_BANKS]);
    expect(new Set(NG_BANKS).size).toBe(NG_BANKS.length);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/bank-account.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/bank-account.ts`:

```ts
/** Banks couples most often use, for the dropdown. "Other" lets them type any bank. */
export const NG_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint",
  "OPay",
  "PalmPay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
] as const;

export function normaliseAccountNumber(raw: string) {
  return raw.replace(/[\s-]/g, "");
}

export function bankDetailsError(input: { currency: string; name: string; bank: string; account: string }): string | null {
  if (!input.name.trim()) return "Account name is required";
  if (!input.bank.trim()) return "Choose your bank";
  const account = normaliseAccountNumber(input.account);
  if (!account) return "Account number is required";
  if (input.currency === "NGN" && !/^\d{10}$/.test(account)) return "Nigerian account numbers have 10 digits";
  return null;
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/bank-account.test.ts`
Expected: PASS.

- [ ] **Step 5: Use it in `saveBankDetails`**

Replace the three `if (…) return { error }` checks with:

```ts
  const input = {
    currency: wedding.currency,
    name: typeof name === "string" ? name : "",
    bank: typeof bank === "string" ? bank : "",
    account: typeof account === "string" ? account : "",
  };
  const error = bankDetailsError(input);
  if (error) return { error };
```

and store `account: normaliseAccountNumber(input.account)`, `routing: ""` (the field is gone from the form; the column stays for existing rows). Check that `requireWeddingAccess` returns `wedding.currency`; if its type lacks it, read it with `db.wedding.findUniqueOrThrow({ where: { id: wedding.id }, select: { currency: true } })`.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit`

```bash
git add lib/bank-account.ts lib/bank-account.test.ts lib/actions/bank-details.ts
git commit -m "feat(gifts): validate Nigerian bank account numbers"
```

---

### Task 9: Dashboard tab in the URL, and the setup checklist helper

**Files:**
- Create: `lib/dashboard-tabs.ts`, `lib/dashboard-tabs.test.ts`, `lib/setup-checklist.ts`, `lib/setup-checklist.test.ts`
- Modify: `components/admin/home.tsx`, `app/dashboard/[weddingId]/page.tsx`, `app/dashboard/[weddingId]/billing/page.tsx`

**Interfaces:**
- Produces:
  - `DASHBOARD_TABS: readonly { id: TabId; label: string; ownerOnly?: boolean }[]` with ids `registry, contributions, media, wishes, rsvps, story, design, wording, people, settings, billing`
  - `type TabId`
  - `tabFromParam(param: string | string[] | undefined, isOwner: boolean): TabId`
  - `dashboardTabHref(weddingId: string, tab: TabId): string`
  - `setupSteps(input: { hasStory: boolean; hasBankDetails: boolean; registryCount: number; hasHeroPhoto: boolean; status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED" }): { id: "details" | "story" | "photo" | "bank" | "registry" | "publish"; label: string; done: boolean; tab: TabId }[]`
  - Both branch plans consume `setupSteps`; DashShell-A replaces `DASHBOARD_TABS` with its grouped list.

- [ ] **Step 1: Failing tests**

`lib/dashboard-tabs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dashboardTabHref, tabFromParam } from "@/lib/dashboard-tabs";

describe("tabFromParam", () => {
  it("returns a known tab", () => {
    expect(tabFromParam("rsvps", false)).toBe("rsvps");
  });
  it("falls back to the first tab for unknown values", () => {
    expect(tabFromParam("nope", true)).toBe("registry");
    expect(tabFromParam(undefined, true)).toBe("registry");
    expect(tabFromParam(["rsvps", "media"], true)).toBe("registry");
  });
  it("hides owner-only tabs from editors", () => {
    expect(tabFromParam("billing", false)).toBe("registry");
    expect(tabFromParam("billing", true)).toBe("billing");
  });
});

describe("dashboardTabHref", () => {
  it("builds the link", () => {
    expect(dashboardTabHref("cm4abc", "billing")).toBe("/dashboard/cm4abc?tab=billing");
  });
});
```

`lib/setup-checklist.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { setupSteps } from "@/lib/setup-checklist";

const fresh = { hasStory: false, hasBankDetails: false, registryCount: 0, hasHeroPhoto: false, status: "DRAFT" as const };

describe("setupSteps", () => {
  it("starts with only the details step done", () => {
    const steps = setupSteps(fresh);
    expect(steps.map((s) => [s.id, s.done])).toEqual([
      ["details", true], ["story", false], ["photo", false], ["bank", false], ["registry", false], ["publish", false],
    ]);
  });
  it("marks publish done once the site is live", () => {
    expect(setupSteps({ ...fresh, status: "ACTIVE" }).find((s) => s.id === "publish")?.done).toBe(true);
  });
  it("points each step at the tab that completes it", () => {
    expect(setupSteps(fresh).find((s) => s.id === "bank")?.tab).toBe("registry");
    expect(setupSteps(fresh).find((s) => s.id === "publish")?.tab).toBe("settings");
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/dashboard-tabs.test.ts lib/setup-checklist.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/dashboard-tabs.ts`:

```ts
export const DASHBOARD_TABS = [
  { id: "registry", label: "Registry" },
  { id: "contributions", label: "Contributions" },
  { id: "media", label: "Photos" },
  { id: "wishes", label: "Wishes" },
  { id: "rsvps", label: "RSVPs" },
  { id: "story", label: "Our story" },
  { id: "design", label: "Design" },
  { id: "wording", label: "Wording" },
  { id: "people", label: "People" },
  { id: "settings", label: "Settings", ownerOnly: true },
  { id: "billing", label: "Billing", ownerOnly: true },
] as const satisfies readonly { id: string; label: string; ownerOnly?: boolean }[];

export type TabId = (typeof DASHBOARD_TABS)[number]["id"];

export function tabFromParam(param: string | string[] | undefined, isOwner: boolean): TabId {
  const tab = DASHBOARD_TABS.find((t) => t.id === param);
  if (!tab || ("ownerOnly" in tab && tab.ownerOnly && !isOwner)) return DASHBOARD_TABS[0].id;
  return tab.id;
}

export function dashboardTabHref(weddingId: string, tab: TabId) {
  return `/dashboard/${weddingId}?tab=${tab}`;
}
```

`lib/setup-checklist.ts`:

```ts
import type { TabId } from "@/lib/dashboard-tabs";

type Input = {
  hasStory: boolean;
  hasBankDetails: boolean;
  registryCount: number;
  hasHeroPhoto: boolean;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
};

/** What a couple still has to do before guests see a complete site, in the order to do it. */
export function setupSteps(input: Input) {
  return [
    { id: "details", label: "Names, date and look", done: true, tab: "story" },
    { id: "story", label: "Tell your story", done: input.hasStory, tab: "story" },
    { id: "photo", label: "Add a cover photo", done: input.hasHeroPhoto, tab: "story" },
    { id: "bank", label: "Add bank details for gifts", done: input.hasBankDetails, tab: "registry" },
    { id: "registry", label: "Add a gift to your registry", done: input.registryCount > 0, tab: "registry" },
    { id: "publish", label: "Publish your site", done: input.status === "ACTIVE", tab: "settings" },
  ] as const satisfies readonly { id: string; label: string; done: boolean; tab: TabId }[];
}
```

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run lib/dashboard-tabs.test.ts lib/setup-checklist.test.ts`
Expected: PASS.

- [ ] **Step 5: Drive `AdminHome` from the URL**

`app/dashboard/[weddingId]/page.tsx` takes `searchParams: Promise<{ tab?: string | string[] }>`, computes `initialTab = tabFromParam((await searchParams).tab, isOwner)` after the `Promise.all`, and passes `initialTab` to `AdminHome`.

In `components/admin/home.tsx`: delete the local `tabs`/`OWNER_TABS` constants; `const [activeTab, setActiveTab] = useState<TabId>(initialTab)`; on click call `setActiveTab(id)` and `window.history.replaceState(null, "", dashboardTabHref(weddingId, id))` (no navigation, so no server refetch). Render tabs from `DASHBOARD_TABS.filter((t) => isOwner || !("ownerOnly" in t && t.ownerOnly))` with `label` as the text and `id` as the key. Give the strip `role="tablist"`, each button `id={\`tab-${t.id}\`}`, `aria-controls="dashboard-panel"`, `tabIndex={isActive ? 0 : -1}`, and handle `ArrowLeft`/`ArrowRight`/`Home`/`End` to move focus and select. Wrap the `<fieldset>` in `<div id="dashboard-panel" role="tabpanel" aria-labelledby={\`tab-${activeTab}\`}>`. Replace each `activeTab === "Registry"` comparison with the matching id.

- [ ] **Step 6: Point the billing return page at Billing**

In `app/dashboard/[weddingId]/billing/page.tsx`, the link becomes `href={dashboardTabHref(wedding.id, "billing")}` with the text "Back to billing"; change the failed message's body to "You haven't been charged. You can try again from Billing."

- [ ] **Step 7: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`. In the browser: click "RSVPs", reload, and RSVPs is still selected; ← and → move between tabs; `?tab=billing` as an editor shows Registry.

```bash
git add lib/dashboard-tabs.ts lib/dashboard-tabs.test.ts lib/setup-checklist.ts lib/setup-checklist.test.ts components/admin/home.tsx app/dashboard
git commit -m "feat(dashboard): keep the open tab in the URL and add the setup checklist helper"
```

---

### Task 10: Registry tab (Registry-B + Registry-C screen)

**Files:**
- Modify: `components/admin/registry-tab.tsx`

**Interfaces:**
- Consumes: `NG_BANKS`, `normaliseAccountNumber` (Task 8), kit parts, `useWeddingCurrency` via `useAdminMoney()` (existing, returns `{ currency, locale }`).

- [ ] **Step 1: Bank details card**

Replace the bank-details read-only grid and form:
- When `!bankDetails.account`, show above everything: `<Notice tone="warning" action={<Button size="sm" onClick={() => setEditingBank(true)}>Add bank details</Button>}>Guests can't give until you add bank details.</Notice>`.
- Read-only view: a `Card` with a `SectionHeading as="h3" title="Where cash gifts go" action={<Button variant="text" size="sm" onClick={…}>Edit</Button>}` and three label/value pairs (Account name, Bank, Account number). SWIFT shows only when set.
- Form: when `money.currency === "NGN"`, Bank is a `SelectInput` of `NG_BANKS` plus an "Other bank" option; choosing "Other bank" reveals a `TextInput label="Bank name"`. Account number uses `inputMode="numeric"`, `maxLength={13}`, and a live hint: `normaliseAccountNumber(value).length === 10 ? "✓ 10 digits" : \`${normaliseAccountNumber(value).length} of 10 digits\``. SWIFT sits behind `<Button variant="text" size="sm">Guests abroad? Add a SWIFT code</Button>`, which reveals the field. No routing field.

- [ ] **Step 2: Registry table**

- Header: `<SectionHeading title="Registry items" action={<Button size="sm" onClick={() => setAdding(true)}>Add a gift</Button>} />`.
- Empty registry (`items.length === 0 && !adding`): `<EmptyState title="No gifts yet" body="Add a few things for your new home, or a fund guests can chip into." action={<Button size="sm" onClick={() => setAdding(true)}>Add your first gift</Button>} />`; the table isn't rendered.
- Columns: a 40px thumbnail (`next/image` `width={40} height={40}` `className="rounded-[4px] object-cover"` `alt=""`), Gift (name bold, category underneath in `text-muted text-[13px]`), Raised (a 4px bar `bg-line` with `bg-success` fill at `raised/goal`, amount underneath), Goal (`<Td numeric>`), and an actions cell with `Edit` and `Delete` as `<Button variant="text" size="sm">`.
- Item form: "Image URL" is hidden behind `<Button variant="text" size="sm">Paste an image link instead</Button>`; the file input is the default. Label the file input "Photo".

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`. In the browser (local DB): an empty wedding shows the warning and the empty state; add bank details with "0123 456 789" → saved as `0123456789`; "12345" shows "Nigerian account numbers have 10 digits"; add a gift with a photo → thumbnail appears.

```bash
git add components/admin/registry-tab.tsx
git commit -m "feat(registry): photos, progress and empty state; Nigerian bank details form"
```

---

### Task 11: Review tabs (Inbox-B)

**Files:**
- Modify: `lib/actions/wishes.ts`, `lib/actions/media.ts`, `lib/actions/contributions.ts`
- Modify: `components/admin/{contributions-tab,media-tab,wishes-tab,home}.tsx`

**Interfaces:**
- Produces server actions: `setWishStatus(weddingId: string, id: string, status: "PENDING" | "APPROVED" | "HIDDEN")`, `setMediaStatus(weddingId: string, id: string, status: "PENDING" | "APPROVED" | "HIDDEN")`, `unconfirmContribution(weddingId: string, id: string)`. Each calls `requireWeddingAccess(weddingId, "edit", "<name>")`, updates `where: { id, weddingId: wedding.id }`, and calls `revalidateDashboard(wedding)`, following `approveWish` in the same file.
- Consumes: `useToast`, `Segmented`, `usePagination`.

- [ ] **Step 1: Add the three actions**

`lib/actions/wishes.ts`:

```ts
export async function setWishStatus(weddingId: string, id: string, status: "PENDING" | "APPROVED" | "HIDDEN") {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "setWishStatus");
  await db.wish.update({ where: { id, weddingId: wedding.id }, data: { status } });
  revalidateDashboard(wedding);
}
```

`setMediaStatus` in `lib/actions/media.ts` is the same shape on `db.media` (also call `revalidateWedding(wedding)` if `approveMedia` does, since approved media shows on the guest site). `unconfirmContribution` in `lib/actions/contributions.ts` sets `{ status: "AWAITING_CONFIRMATION", confirmedAt: null }` and calls `revalidateWedding(wedding)` like `confirmContribution`.

- [ ] **Step 2: One list at a time with a switch**

In each of the three tabs, replace the stacked sections with a `Segmented` (label "Show") holding `pending`, `approved`, `hidden` (contributions: `pending`, `confirmed`), each with its count, defaulting to `pending`. Render only the selected list, paged with `usePagination(list, 24)` and `<Pagination>`. Empty lists use `EmptyState` ("Nothing waiting for you", "No approved wishes yet", "Nothing hidden").

- [ ] **Step 3: Missing and bulk actions**

- Wishes, Approved view: each card gets a `Hide` button (`setWishStatus(…, "HIDDEN")`); `home.tsx` gains `handleHideApprovedWish` that moves it from approved to hidden state.
- Media, Pending view: each tile gets a checkbox (`aria-label={\`Select photo from ${m.guestName}\`}`); when any are selected, a bar shows "N selected" with `Approve` and `Hide`, running the existing handlers for each selected item in sequence.
- Media tiles: videos render with `preload="metadata"` and no `controls`; clicking opens the file in a new tab (`<a href={url} target="_blank" rel="noopener">`).
- Contributions: `Confirm` opens `confirm({ title: \`Confirm ₦… from ${guestName}?\`, description: \`Check your bank app for a transfer with reference ${reference ?? "their name"} before confirming.\`, confirmLabel: "Confirm", danger: false })` (use `formatMoney` for the amount).

- [ ] **Step 4: Undo toasts**

After each approve, hide, restore or confirm succeeds, call `toast({ message, undo })` where `undo` calls the matching `set…Status` / `unconfirmContribution` back to the previous status and moves the item back in `home.tsx` state. Messages: "Wish approved", "Wish hidden", "Photo approved", "Photo hidden", "3 photos approved", "₦50,000 from Tunde confirmed".

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`. In the browser: approve a wish, press Undo, and it returns to Pending; hide an approved wish; select 3 pending photos and approve them together.

```bash
git add lib/actions components/admin
git commit -m "feat(review): switch between pending, approved and hidden, with undo and bulk approve"
```

---

### Task 12: Our Story (Story-A)

**Files:**
- Modify: `components/admin/story-tab.tsx`, `components/admin/story-beats-section.tsx`

**Interfaces:**
- Consumes: kit parts, `useToast`.

- [ ] **Step 1: Group the form into cards**

Split the single form's fields, in this order, into four `Card`s inside the same `<form>`, each with an `h3` `SectionHeading`: "The basics" (first partner's name, second partner's name, tagline), "When and where" (date, time, city, full venue address with the hint "Only sent to guests who say yes, in their confirmation email"), "Your story" (how you met, what you love, love notes), "Contact" (contact email, first partner's phone, second partner's phone). Replace the intro paragraph with "Changes here show on your site as soon as you save." Rename labels: "Bride's RSVP number" → "First partner's phone", "Groom's RSVP number" → "Second partner's phone" (keep the `name` attributes unchanged). One Save button at the bottom of the form, with a toast on success.

- [ ] **Step 2: Photos as a grid**

Replace the Story photos table with a grid (`grid-cols-3 sm:grid-cols-5`) of square thumbnails, each with an overlay "Edit" and "Remove" pair of text buttons and "Move earlier" / "Move later" icon buttons (`aria-label`s) that call the existing reorder action (look for it in `lib/actions/story-photos.ts`; if there isn't one, add `moveStoryPhoto(weddingId, id, direction: "up" | "down")` that swaps `order` with the neighbour inside a transaction). The last cell is an "Add photos" tile that opens the existing bulk upload input.

- [ ] **Step 3: Beats list**

In `story-beats-section.tsx`, render beats as a vertical list of `Card`s (photo, year, title, one-line text) with the same Edit/Remove/Move controls instead of a table.

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit && npm run lint`. In the browser at 390px: no horizontal scroll on the tab; reorder two photos and check the guest site's order changes.

```bash
git add components/admin/story-tab.tsx components/admin/story-beats-section.tsx lib/actions/story-photos.ts
git commit -m "feat(story): group the story form into sections and manage photos as a grid"
```

---

### Task 13: Design preview on phones (Design-A)

**Files:**
- Modify: `components/admin/design-tab.tsx`

- [ ] **Step 1: Pinned Preview button and full-screen sheet**

Below `lg`, hide the inline preview `<section>` (`hidden lg:flex`) and render a fixed button `<Button variant="inverse" size="lg" className="fixed bottom-5 left-1/2 z-nav -translate-x-1/2 shadow-lg lg:hidden">Preview</Button>`. It opens a full-screen `role="dialog"` layer (`fixed inset-0 z-overlay flex flex-col bg-surface lg:hidden`) with a header ("Preview", an "Unsaved changes" chip when `unsaved`, and a "Close" button) and the same iframe filling the rest. Reuse the existing `frameRef`/`applyPreview` logic by rendering one iframe whose container moves between the inline section and the sheet via CSS, not two iframes: on phones the section becomes the sheet when `previewOpen` is true (`fixed inset-0 z-overlay`), otherwise `hidden lg:flex`.

- [ ] **Step 2: Verify and commit**

At 390px: change the theme, tap Preview, and the change shows; Close returns to the same scroll position. At 1280px nothing changes.

```bash
git add components/admin/design-tab.tsx
git commit -m "feat(design): full-screen preview on phones"
```

---

### Task 14: Wording (Wording-A)

**Files:**
- Modify: `components/admin/wording-tab.tsx`, `app/dashboard/[weddingId]/page.tsx`, `components/admin/home.tsx`

**Interfaces:**
- Produces: `WordingTab` gains `plans: { creditPlan: string | null; brandingPlan: string | null }`.

- [ ] **Step 1: Plan names from data**

In the page, compute from the `plans` list already loaded: `creditPlan = plans.find((p) => hasFeature(p, "customCredit"))?.name ?? null` and `brandingPlan = plans.find((p) => hasFeature(p, "removeBranding"))?.name ?? null`, and pass them through. In the tab, build the notice from them: `Your plan shows “Made with love by Vowly”.` + (`brandingPlan` ? ` Upgrade to ${brandingPlan} to remove it` : "") + (`creditPlan` ? `, or to ${creditPlan} to credit someone of your choice.` : "."). No hardcoded "Forever".

- [ ] **Step 2: Defaults as helper text**

Each copy field becomes a `TextArea` with no `placeholder`. Under it: when empty, `Guests see: “{fallback}”` with a text button "Start from this" that fills the textarea with the fallback; when filled, a text button "Use the default" that clears it. Keep `maxLength`, and show `{length}/{COPY_MAX_LENGTH}` in the hint.

- [ ] **Step 3: Rename the section**

The heading "RSVP email" becomes "Asoebi", with the description "Show a section about the fabric, with a WhatsApp button to order it."

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit && npm run lint`. Rename a plan in `/super/plans` (local DB) and check the Wording notice uses the new name.

```bash
git add components/admin/wording-tab.tsx components/admin/home.tsx app/dashboard
git commit -m "feat(wording): show default text clearly and read plan names from data"
```

---

### Task 15: Settings (Settings-B)

**Files:**
- Modify: `components/admin/settings-tab.tsx`, `lib/money.ts`

**Interfaces:**
- Produces: `localeLabel(locale: string): string` in `lib/money.ts` (e.g. `en-NG` → `Nigeria · ₦1,234.56`), tested in `lib/money.test.ts`.

- [ ] **Step 1: Failing test for `localeLabel`**

Append to `lib/money.test.ts`:

```ts
import { localeLabel } from "@/lib/money";

describe("localeLabel", () => {
  it("names the country and shows a sample", () => {
    expect(localeLabel("en-NG", "NGN")).toBe("Nigeria · ₦1,234.56");
    expect(localeLabel("en-GB", "GBP")).toBe("United Kingdom · £1,234.56");
  });
});
```

Run: `npx vitest run lib/money.test.ts` → FAIL.

- [ ] **Step 2: Implement**

In `lib/money.ts`:

```ts
/** A readable name for a number-format locale, with a sample amount in that format. */
export function localeLabel(locale: string, currency: string) {
  const region = locale.split("-")[1];
  const country = region ? new Intl.DisplayNames(["en"], { type: "region" }).of(region) : locale;
  return `${country} · ${new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }).format(1234.56)}`;
}
```

Run: `npx vitest run lib/money.test.ts` → PASS.

- [ ] **Step 3: Settings changes**

- Web address: reuse the debounced availability check from `create-wedding-form.tsx` (call `checkSlugAvailable`, skip the check when the value equals the saved slug), showing "✓ That address is free" / the reason under the field.
- Number format `<option>`s show `localeLabel(l, currency)`; Currency options show `${code} (${currencySymbol({ currency: code, locale })})`.
- Guests abroad: when `settings.geoBypassToken` is set, a `Button variant="secondary" size="sm"` "Copy link for guests abroad" copies `${location.origin}${guestUrl}?access=${token}` (use `GEO_BYPASS_PARAM` from `lib/geo.ts` instead of hardcoding `access`) and toasts "Link copied". Pass `guestUrl` into `SettingsTab`.
- The publish panel's Unpublish becomes `buttonClass("secondary", "sm")`, Publish `buttonClass("primary", "md")`.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`.

```bash
git add lib/money.ts lib/money.test.ts components/admin/settings-tab.tsx components/admin/home.tsx
git commit -m "feat(settings): address check, readable formats and a link for guests abroad"
```

---

### Task 16: Billing (Billing-A)

**Files:**
- Modify: `components/admin/billing-tab.tsx`, `app/dashboard/[weddingId]/page.tsx`

- [ ] **Step 1: Current plan card and status badges**

At the top, a `Card` (gold border `border-action`) with the plan name, "Current plan" chip, the existing `closingNote(...)` text, and chips for the plan's first three `highlights`. Payment status cells use `StatusBadge` from `components/super/status-badge.tsx` (it already maps `SUCCESS`/`FAILED`/`PENDING`), and the table uses `TableShell`/`Th`/`Td` with `numeric` on Amount. Dates display as `12 Jun 2026` (`toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })`).

- [ ] **Step 2: Verify and commit**

Run: `npx tsc --noEmit && npm run lint`.

```bash
git add components/admin/billing-tab.tsx app/dashboard
git commit -m "feat(billing): current plan summary and payment status badges"
```

---

### Task 17: Landing (Landing-A)

**Files:**
- Modify: `components/marketing/shell.tsx`, `components/marketing/theme-showcase.tsx`, `app/(marketing)/page.tsx`

- [ ] **Step 1: Header**

In `shell.tsx`: restore the Pricing link (delete the comment markers), and show "Create your site" on phones too (drop `hidden … sm:inline-block`; use `px-3.5` on phones so logo + Sign in + Create fit at 360px — test at 360px). In `page.tsx`, delete the commented-out "Compare plans" link.

- [ ] **Step 2: Theme strips**

In `theme-showcase.tsx`: add an `onKeyDown` on the radiogroup that moves selection with ArrowLeft/ArrowRight/Home/End and focuses the new strip; only the selected strip has `tabIndex={0}`, others `-1`. Replace the hint paragraph with a line that always names the selection: `<p aria-live="polite" …><span className="font-semibold text-(--m-ink)">{preset.name}</span> · Pick a strip to dress the site. Every colour and font can be changed later.</p>`.

- [ ] **Step 3: Verify and commit**

At 360px the header fits on one line; Tab to the strips, then arrows change the preview.

```bash
git add components/marketing app/\(marketing\)/page.tsx
git commit -m "feat(landing): sign-up button on phones, pricing link, keyboard theme strips"
```

---

### Task 18: Pricing (Pricing-B)

**Files:**
- Create: `components/marketing/faq.tsx`
- Modify: `app/(marketing)/pricing/page.tsx`, `app/(marketing)/page.tsx`

**Interfaces:**
- Produces: `Faq({ items: { q: string; a: string }[] })` and `PRICING_FAQS` exported from `faq.tsx`; the landing page's `FAQS` array moves there as `LANDING_FAQS`.

- [ ] **Step 1: Move the FAQ markup into `faq.tsx`**

Move the `<details>` list markup from the landing page into `Faq`, and export both arrays. `PRICING_FAQS` holds the landing FAQs whose question mentions subscription, money or privacy, plus: `{ q: "What happens after the wedding?", a: "Your site stays online for the time your plan includes, then shows guests a thank-you page. Upgrading later keeps it up longer." }`.

- [ ] **Step 2: Worked example band**

In `pricing/page.tsx`, between the intro and `<Pricing />`, add a band built from the two cheapest paid plans (query `prisma.plan.findMany({ where: { active: true, priceKobo: { gt: 0 } }, orderBy: { priceKobo: "asc" }, take: 2 })`; render nothing if fewer than two): "Buy {a.name} for {price a}" → "Later want {b.name} ({price b})" → "You pay {price b − price a}", using `formatMoney` with NGN. Then `<Faq items={PRICING_FAQS} />` after the plans.

- [ ] **Step 3: Verify and commit**

`/pricing` shows the band with real plan names and prices from the local DB, and the FAQ opens with Enter/Space.

```bash
git add components/marketing/faq.tsx app/\(marketing\)
git commit -m "feat(pricing): explain paying once with a worked example and FAQs"
```

---

### Task 19: Sign-up (Auth-A)

**Files:**
- Modify: `components/auth/signup-form.tsx`, `lib/actions/auth.ts`, `app/dashboard/new/page.tsx`

- [ ] **Step 1: Drop the partner field**

In `signup-form.tsx`, remove the "Your partner's name" field and make "Your name" full width. In `lib/actions/auth.ts` `signup`, delete the `partnerName` read, validation and `rememberPartnerName` call (keep `rememberPartnerName` in `lib/onboarding.ts`; onboarding still reads an empty cookie safely). `app/dashboard/new/page.tsx` needs no change: `getPartnerName()` returns `""`.

- [ ] **Step 2: Errors next to their fields**

`checkBeforeSubmit` also checks the terms box: if unchecked, `e.preventDefault()`, set `termsError` to "Tick this box to continue", and focus the checkbox. Render `termsError` directly under the checkbox (`text-[13px] text-danger`, `id="terms-error"`, checkbox `aria-describedby="terms-error"` and `aria-invalid`). The password message moves under the password field the same way (`PasswordField` gets an `error` prop rendered under its hint).

- [ ] **Step 3: Verify and commit**

Submitting with the box unticked shows the message under it without a network request (check the Network tab).

```bash
git add components/auth lib/actions/auth.ts
git commit -m "feat(auth): shorter sign-up with errors beside their fields"
```

---

### Task 20: Your weddings (Weddings-A)

**Files:**
- Modify: `app/dashboard/page.tsx`, `app/dashboard/account/page.tsx`

- [ ] **Step 1: Richer cards**

Extend the query's `include` with `_count: { select: { rsvps: { where: { attending: true } } } }` and fetch pending counts in one extra query: `prisma.wedding.findMany({ where: { id: { in: ids } }, select: { id: true, _count: { select: { contributions: { where: { status: "AWAITING_CONFIRMATION" } }, wishes: { where: { status: "PENDING" } }, media: { where: { status: "PENDING" } } } } } })`. Each card shows the date (`Sat 12 Dec 2026`), days to go (or "Married 3 Oct 2026" once past), the RSVP count, and a `chip` "N to review" when the pending total is above 0.

- [ ] **Step 2: Account back link**

In `account/page.tsx`, count the user's weddings; with exactly one, the back link reads "Back to {couple title}" and goes to `dashboardPath(id)`; otherwise "Your weddings" → `/dashboard`.

- [ ] **Step 3: Verify and commit**

```bash
git add app/dashboard/page.tsx app/dashboard/account/page.tsx
git commit -m "feat(dashboard): show date, RSVPs and items to review on wedding cards"
```

---

### Task 21: Guest RSVP form (GuestRSVP-A) and the guest baseline (Global-D)

**Files:**
- Modify: `app/globals.css`, `components/guest/rsvp-form.tsx`, `components/guest/wish-form.tsx`, `components/guest/gift-card.tsx` (fields only; layout changes belong to the gift options in the branch plans), `components/guest/gallery-upload.tsx`, `components/guest/heroes/hero-ctas.tsx`
- Modify: `lib/ui-guards.test.ts`

**Interfaces:**
- Produces: CSS classes `guest-label`, `guest-input`, `guest-btn`, `guest-choice` scoped under `[data-wedding-theme]`; later guest work uses them.

- [ ] **Step 1: Guard test for guest fields (fails now)**

Append to `lib/ui-guards.test.ts`:

```ts
describe("guest site", () => {
  it("has no fields that hide focus", () => {
    const offenders = files("components/guest").filter((f) => /outline-none/.test(readFileSync(join(ROOT, f), "utf8")));
    expect(offenders).toEqual([]);
  });
  it("has no text smaller than 12px", () => {
    const offenders = files("components/guest").filter((f) => /text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/.test(readFileSync(join(ROOT, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
```

Run: `npx vitest run lib/ui-guards.test.ts` → FAIL listing `rsvp-form`, `wish-form`, `gift-card` and others.

- [ ] **Step 2: Guest baseline CSS**

Append to `app/globals.css`:

```css
/* Guest sites: labelled fields and a visible focus ring in the wedding's own colour. */
[data-wedding-theme] :focus-visible {
  outline: 2px solid var(--burnt-orange);
  outline-offset: 2px;
}
[data-wedding-theme] .guest-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
[data-wedding-theme] .guest-input {
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid rgb(var(--ink) / 0.3);
  background: #fff;
  padding: 0.625rem 0.875rem;
  font-size: 1rem;
  color: var(--foreground);
}
[data-wedding-theme] .guest-input:focus-visible {
  border-color: var(--burnt-orange);
}
[data-wedding-theme] .guest-btn {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  background: var(--burnt-orange);
  color: var(--ivory);
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color 150ms;
}
[data-wedding-theme] .guest-btn:hover {
  background: var(--burnt-orange-dark);
}
[data-wedding-theme] .guest-btn:disabled {
  opacity: 0.6;
}
[data-wedding-theme] .guest-choice {
  display: flex;
  min-height: 2.75rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(var(--ink) / 0.3);
  background: #fff;
  padding: 0.75rem;
  text-align: center;
  font-size: 0.9375rem;
}
[data-wedding-theme] .guest-choice:has(input:checked) {
  border: 2px solid var(--burnt-orange);
  color: var(--burnt-orange);
  font-weight: 600;
}
[data-wedding-theme] .guest-choice:has(input:focus-visible) {
  outline: 2px solid var(--burnt-orange);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Rewrite the RSVP form fields**

`components/guest/rsvp-form.tsx`, keeping the honeypot and success view (success text sizes become `text-[13px]` minimum):

```tsx
<form action={formAction} className="flex flex-col gap-5">
  {/* honeypot unchanged */}
  <div>
    <label htmlFor="rsvp-name" className="guest-label">Your name</label>
    <input id="rsvp-name" name="name" autoComplete="name" required className="guest-input" />
  </div>
  <fieldset>
    <legend className="guest-label">Will you attend?</legend>
    <div className="grid grid-cols-2 gap-3">
      <label className="guest-choice">
        <input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} className="sr-only" />
        Yes, I&apos;ll be there
      </label>
      <label className="guest-choice">
        <input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} className="sr-only" />
        Sorry, I can&apos;t
      </label>
    </div>
  </fieldset>
  {attending === "yes" && (
    <div>
      <label htmlFor="rsvp-party" className="guest-label">How many of you, including you?</label>
      <div className="flex items-stretch border border-foreground/30 bg-white">
        <button type="button" aria-label="One fewer" onClick={() => setParty((n) => Math.max(1, n - 1))} className="min-w-11 text-xl">−</button>
        <input id="rsvp-party" name="partySize" inputMode="numeric" value={party} onChange={(e) => setParty(Math.min(MAX_PARTY_SIZE, Math.max(1, Number(e.target.value) || 1)))} className="w-full border-x border-foreground/20 text-center text-base" />
        <button type="button" aria-label="One more" onClick={() => setParty((n) => Math.min(MAX_PARTY_SIZE, n + 1))} className="min-w-11 text-xl">+</button>
      </div>
    </div>
  )}
  <div>
    <label htmlFor="rsvp-email" className="guest-label">Email <span className="normal-case tracking-normal font-normal opacity-70">(optional, for your confirmation)</span></label>
    <input id="rsvp-email" type="email" name="email" autoComplete="email" className="guest-input" />
  </div>
  <div>
    <label htmlFor="rsvp-message" className="guest-label">Message <span className="normal-case tracking-normal font-normal opacity-70">(optional)</span></label>
    <textarea id="rsvp-message" name="message" rows={3} className="guest-input resize-none" />
  </div>
  {state?.error && <p role="alert" className="text-[15px] text-burnt-orange-dark">{state.error}</p>}
  <button type="submit" disabled={pending} className="guest-btn w-full">{pending ? "Sending…" : "Send RSVP"}</button>
</form>
```

Add `const [party, setParty] = useState(1);` and import `MAX_PARTY_SIZE` from `@/lib/rsvp-rules`. The success heading becomes `text-[13px]`.

- [ ] **Step 4: Same treatment for the other guest fields**

- `wish-form.tsx`: labelled "Your name" and "Your wish" fields using `guest-label`/`guest-input`, counter `text-[13px]`, submit `guest-btn w-full sm:w-auto`, "Leave a wish" (sentence case), success eyebrow `text-[13px]`.
- `gift-card.tsx`: the name input gets `<label className="guest-label" htmlFor={\`gift-name-${gift.id}\`}>Your name</label>` and `guest-input`; the amount input gets a visible "Amount" label; every `text-[10.5px]`, `text-[11px]`, `text-[11.5px]` becomes `text-[13px]`; `text-[12.5px]`/`text-[13.5px]` become `text-sm`; all buttons get `min-h-11`. Layout and wording changes are left to the branch plans (GuestGift-A/B).
- `gallery-upload.tsx`: any `outline-none` removed; name field labelled.
- `hero-ctas.tsx`: "RSVP Now" → "RSVP", "View Registry" → "See the registry"; add `min-h-11 inline-flex items-center`.
- Sweep `components/guest` for remaining `outline-none` and sub-12px text until the guard passes.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass, including both `guest site` guards. In the browser at 390px on a guest site: Tab through the RSVP form and every control shows a ring in the theme colour; "No email" RSVP succeeds; a party of 11 isn't possible; a second RSVP with the same name and no email is refused.

```bash
git add app/globals.css components/guest lib/ui-guards.test.ts
git commit -m "feat(guest): labelled fields, visible focus, party size and readable text"
```

---

### Task 22: Guest photos and wishes (GuestWall-A)

**Files:**
- Create: `components/guest/lightbox.tsx`, `components/guest/load-more.tsx`
- Modify: `app/w/[slug]/gallery/page.tsx`, `app/w/[slug]/wishes/page.tsx`

**Interfaces:**
- Produces: `Lightbox({ items: { id: string; url: string; type: "IMAGE" | "VIDEO"; guestName: string }[] })`, a client grid that opens a full-screen viewer; `PAGE_SIZE = 24` via `?shown=` search param.

- [ ] **Step 1: Paging via `?shown=`**

Both pages read `searchParams.shown` (integer, default 24, max 500) and `take: shown` in their queries plus a `count`. When `count > shown`, render `<Link href={\`?shown=${shown + 24}\`} scroll={false} className="guest-btn">Load more</Link>` under the grid.

- [ ] **Step 2: Empty states**

When there are no approved items: gallery shows `Be the first to share a photo from the day.`; wishes shows `No wishes yet. Yours could be the first.` in the page's serif style, centred, and the grid isn't rendered. Remove the second "Gallery Wall"/"Wishes from loved ones" eyebrow above the grid.

- [ ] **Step 3: Lightbox**

`components/guest/lightbox.tsx` ("use client") renders the grid of buttons (`aria-label={\`Open photo from ${guestName}\`}`); clicking opens a `role="dialog" aria-modal="true"` layer (`fixed inset-0 z-overlay bg-black/95`) showing the image (`next/image`, `fill`, `object-contain`) or video (`controls`, `playsInline`), "3 of 48", "From Amaka", previous/next buttons (44px), Escape and arrow keys, and swipe (pointerdown/pointerup with a 50px threshold). Focus moves to Close on open and back to the opener on close. Grid videos show a play badge instead of inline controls.

- [ ] **Step 4: Verify and commit**

At 390px: tap a photo, swipe to the next, press Escape; with 30 approved photos "Load more" appears and loads the rest without jumping to the top.

```bash
git add components/guest/lightbox.tsx components/guest/load-more.tsx app/w/\[slug\]/gallery app/w/\[slug\]/wishes
git commit -m "feat(guest): photo lightbox, paging and empty states on the wall pages"
```

---

### Task 23: Guest nav fixes and blocked states (GuestStates-A, shared nav fixes)

**Files:**
- Create: `lib/nav-date.ts`, `lib/nav-date.test.ts`
- Modify: `components/guest/nav.tsx`, `components/guest/nav-client.tsx`, `components/guest/blocked-access.tsx`, `app/w/[slug]/layout.tsx`

**Interfaces:**
- Produces: `formatNavDate(weddingDateISO: string): string` → `"SAT 12 DEC"`; `GuestNavClient` gets a `galleryOn: boolean` prop.

- [ ] **Step 1: Failing test**

`lib/nav-date.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatNavDate } from "@/lib/nav-date";

describe("formatNavDate", () => {
  it("puts the day before the month", () => {
    expect(formatNavDate("2026-12-12T13:00:00.000Z")).toBe("SAT 12 DEC");
  });
  it("uses the stored calendar date, not the viewer's timezone", () => {
    expect(formatNavDate("2026-12-12T23:30:00.000Z")).toBe("SAT 12 DEC");
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement**

`lib/nav-date.ts`:

```ts
/** "SAT 12 DEC": day first, as guests in Nigeria read dates. */
export function formatNavDate(weddingDateISO: string) {
  return new Date(weddingDateISO)
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .replace(",", "")
    .toUpperCase();
}
```

Run → PASS. Delete the old `formatNavDate` from `nav.tsx` and import this one.

- [ ] **Step 3: Nav fixes**

- `nav.tsx` passes `galleryOn = (story?.galleryEnabled ?? false) && hasFeature(wedding.plan, "gallery")` (load the wedding with `getWeddingById`).
- `nav-client.tsx`: "Gallery Wall" link only when `galleryOn`, renamed "Photos"; "Wall of Wishes" → "Wishes"; the RSVP link's classes are built with a ternary (`link.label === "RSVP" ? "…" : ""`) so no `false` class leaks; the inline `style` objects become Tailwind classes (`font-(family-name:--serif) text-[26px] font-semibold tracking-[.02em]`, `font-(family-name:--sans) text-[12px] tracking-[.3em] uppercase opacity-70` — 12px, not 10px); the menu button becomes `h-11 w-11`; nav gets `z-nav` instead of `z-50`.

- [ ] **Step 4: Blocked and closed states**

- `blocked-access.tsx` takes `names: string | null` and shows them in the script font above the message; message: "This site is only open in some countries. If the couple sent you an access code, enter it here."; the input gets `<label htmlFor="access-code" className="guest-label">Access code</label>` and `guest-input`; the button is `guest-btn` "Open the site".
- `app/w/[slug]/layout.tsx`: pass `coupleTitle(...)` to `BlockedAccess` and use it in the closed/unavailable states too; the preview banner uses `z-banner`, `text-[13px]`, and the layout adds `pb-12` to the content wrapper when `preview` is true so the banner never covers the footer.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`.

```bash
git add lib/nav-date.ts lib/nav-date.test.ts components/guest app/w/\[slug\]/layout.tsx
git commit -m "fix(guest): day-first nav date, hide Photos when off, labelled access code"
```

---

### Task 24: 404 and error pages (System-A)

**Files:**
- Create: `app/not-found.tsx`, `app/error.tsx`, `app/w/[slug]/not-found.tsx`, `app/w/[slug]/[...rest]/page.tsx`, `components/guest/site-home-link.tsx`

- [ ] **Step 1: Read the conventions**

Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md` and `error.md`. Error boundaries are client components and receive `{ error, unstable_retry }`.

- [ ] **Step 2: Platform pages**

`app/not-found.tsx`:

```tsx
import Link from "next/link";
import MarketingShell from "@/components/marketing/shell";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-xl flex-col items-start gap-4 px-5 py-24 sm:px-8">
        <h1 className="font-(family-name:--m-display) text-4xl font-extrabold tracking-[-0.03em]">We can&apos;t find that page</h1>
        <p className="text-lg text-(--m-ink)/75">The link may be old or mistyped.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonClass("primary", "lg")}>Go to your dashboard</Link>
          <Link href="/" className={buttonClass("secondary", "lg")}>Home</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
```

`app/error.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { BRAND_CLASS, BRAND_STYLE } from "@/components/marketing/brand";
import { Button } from "@/components/ui/button";

export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={BRAND_STYLE} className={`${BRAND_CLASS} flex min-h-screen items-center justify-center px-5`}>
      <div className="flex max-w-md flex-col items-start gap-4">
        <h1 className="font-(family-name:--m-display) text-3xl font-extrabold tracking-[-0.02em]">Something went wrong</h1>
        <p className="text-(--m-ink)/75">We couldn&apos;t load this page. Your changes up to now are saved.</p>
        <Button size="lg" onClick={() => unstable_retry()}>Try again</Button>
        {error.digest && <p className="text-[13px] text-muted">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
```

`MarketingShell` is an async server component, so `app/not-found.tsx` stays a server component (no `"use client"`).

- [ ] **Step 3: Themed guest 404**

`app/w/[slug]/[...rest]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

// Unknown paths under a wedding site show that site's own 404, inside its theme.
export default function UnknownGuestPath() {
  notFound();
}
```

`app/w/[slug]/not-found.tsx`:

```tsx
import SiteHomeLink from "@/components/guest/site-home-link";

export default function GuestNotFound() {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="font-(family-name:--serif) text-4xl text-foreground">This page isn&apos;t part of the site</h1>
      <p className="text-base text-foreground/75">It may have moved, or the link was mistyped.</p>
      <SiteHomeLink />
    </main>
  );
}
```

`not-found` files receive no props, so the link works out the site root from the current path. Create `components/guest/site-home-link.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Links to the wedding site's home: /w/<slug> on Vowly's domain, / on a couple's own domain. */
export default function SiteHomeLink() {
  const match = usePathname().match(/^\/w\/[^/]+/);
  return (
    <Link href={match ? match[0] : "/"} className="guest-btn">
      Go to the wedding site
    </Link>
  );
}
```

(On a custom domain, `proxy.ts` rewrites to `/w/<slug>/…` internally but the browser path has no `/w/` prefix, so `/` is correct there.)

- [ ] **Step 4: Verify and commit**

Run: `npm run build`. Then: `/nope` → branded 404 (status 404 in the Network tab); `/w/<slug>/nope` and `/w/<slug>/a/b` → themed 404 whose link opens `/w/<slug>`; `/w/unknown-slug` → branded 404; throw temporarily in a dashboard tab component → error page with "Try again" (remove the throw).

```bash
git add app/not-found.tsx app/error.tsx app/w/\[slug\]/not-found.tsx app/w/\[slug\]/\[...rest\] components/guest/site-home-link.tsx
git commit -m "feat: branded 404 and error pages, themed 404 on wedding sites"
```

---

### Task 25: Whole-branch check

- [ ] **Step 1: Automated checks**

Run: `RESEND_API_KEY= npx vitest run && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 2: Walkthrough (local DB, 1280px and 390px)**

Sign up → create a wedding → add bank details → add a gift with a photo → open the guest site → RSVP with no email and a party of 3 → contribute to a gift and note the reference → back in the dashboard, confirm it (reference shows) and press Undo → approve a wish → publish from Settings. Check keyboard-only on the guest RSVP form and on the dashboard tabs.

- [ ] **Step 3: Record what the branch plans can rely on**

Append a short "Base provides" section to this file listing the exported names from every task's Interfaces block, then commit:

```bash
git add docs/superpowers/plans/2026-09-29-revamp-base.md
git commit -m "docs: note what revamp/base provides to the branch plans"
```

---

## After base

Two short follow-up plans, written once base is merged into its own branch (they depend on the names above):

- `revamp/mine`: DashShell-C (URL tab already done; add badges, status pill + Publish in the header, fade), setup checklist card above the tabs (from `setupSteps`, hidden once published), RSVPs-B (search, toolbar, quiet Send), People-A, Account-B, GuestHome-B (RSVP in the phone nav, time on the Cover hero), GuestGift-B, Staff-B (no change), then Global-C skin last.
- `revamp/recommended`: DashShell-A (Overview from `setupSteps`, 6 grouped tabs replacing `DASHBOARD_TABS`), Onboard-A redirect to Overview, RSVPs-A+C, People-B, Account-A, GuestHome-A, GuestGift-A, GuestStates-B, Staff-A.

---

## Base provides (for the branch plans)

Built on `revamp/base`; names as they exist in the code, including rulings made during execution.

- **Tokens and utilities:** colour classes `action`, `action-ink`, `danger`, `success`, `warning`, `surface`, `surface-muted`, `line`, `muted`, `ink`, `paper`; stacking classes `z-nav`, `z-overlay`, `z-toast`, `z-banner` (`@utility` rules in `app/globals.css`, not theme variables).
- **UI kit (`components/ui`):** `Button`, `buttonClass(variant, size)`, `Field`, `inputClass`, `TextInput`, `SelectInput`, `TextArea`, `SectionHeading`, `Card`, `TableShell`/`Th`/`Td`, `EmptyState`, `Notice`, `Segmented`, `ToastProvider`, `useToast`, `useSuccessToast(state, message)`.
- **Guest CSS:** `guest-label`, `guest-input`, `guest-btn`, `guest-choice` under `[data-wedding-theme]`.
- **Logic (`lib/`, all tested):** `guestCapacity`, `seatsLeft`, `capacityError` (capacity.ts); `parseGuestRsvp`, `MAX_PARTY_SIZE` (rsvp-rules.ts); `transferReference`, `isTransferReference`, `REFERENCE_ALPHABET` (transfer-reference.ts, format `HONEY-7KQ2MX`; the guest gift card does **not** generate references yet — GuestGift-A/B must call it and post `reference`); `NG_BANKS`, `normaliseAccountNumber`, `bankDetailsError` (bank-account.ts); `DASHBOARD_TABS`, `TabId`, `tabFromParam`, `dashboardTabHref` (dashboard-tabs.ts); `setupSteps` (setup-checklist.ts); `moveInList` (reorder.ts); `creditUpgradeNotice` (credit-notice.ts); `localeLabel` (money.ts); `shortDate` (format-date.ts); `countdownLabel` (countdown-label.ts); `upgradeExample` (pricing-example.ts); `shownParam`, `SHOWN_STEP` (shown-param.ts); `formatNavDate` (nav-date.ts); `GEO_BYPASS_PARAM` (geo-param.ts, client-safe).
- **Server actions:** `setWishStatus`, `setMediaStatus`, `unconfirmContribution`, `moveStoryPhoto`, `moveStoryBeat`; `submitRsvp` reads `name`, `partySize`, optional `email`; `submitContribution` accepts `reference`.
- **Dashboard:** `AdminHome` takes `initialTab` and `capacity`; review handlers are `handleWishChange(wish, from, to)` and `handleMediaChange(items, from, to)` with undo; `reviewMessage` (components/admin/review.ts).
- **Data:** `Contribution.reference` column (migration `20261010100000_contribution_reference`); `WishView` and `MediaView` replace the per-status view types (aliases kept).

## Found during the walkthrough (not fixed on base)

- Onboarding preselects the **Adire Indigo** theme, which the Free plan doesn't include, so a new couple on Free can't publish until they change theme in Design. Onboard-A in both branch plans should default to a theme the starter plan allows.
