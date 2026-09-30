"use client";

import { startTransition, useActionState } from "react";
import { saveStaffProfile } from "@/lib/actions/staff-profile";
import { GENDERS } from "@/lib/staff-profile";
import type { StaffProfileView } from "@/lib/staff-profiles";
import { buttonClass } from "@/components/ui/button";

const field = "w-full border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink/50";
const label = "flex flex-col gap-1.5 text-sm font-medium";
const hint = "text-xs font-normal text-muted";

function Section({ title, hint: note, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid grid-cols-1 gap-4 border-t border-line pt-5 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-8">
      <legend className="contents">
        <span className="flex flex-col gap-1">
          <span className="text-base font-semibold">{title}</span>
          {note && <span className={hint}>{note}</span>}
        </span>
      </legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CountrySelect({ name, defaultValue, countries }: { name: string; defaultValue: string; countries: { code: string; name: string }[] }) {
  return (
    <select name={name} defaultValue={defaultValue} className={field}>
      <option value="">Choose…</option>
      {countries.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

/** A staff member's details: basics, personal details and an emergency contact. */
export default function StaffProfileForm({
  userId,
  values: v,
  countries,
  self,
}: {
  userId: string;
  values: StaffProfileView["values"];
  countries: { code: string; name: string }[];
  /** Editing your own profile (wording only). */
  self: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveStaffProfile.bind(null, userId), undefined);
  // Newest allowed date of birth: 16 years ago today.
  const maxBirth = new Date(new Date().setUTCFullYear(new Date().getUTCFullYear() - 16)).toISOString().slice(0, 10);

  return (
    <form
      // Submitted by hand so React doesn't reset the fields after saving.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-6 rounded-[6px] border border-line bg-surface p-5 sm:p-6"
    >
      <Section title="Basics">
        <label className={label}>
          Full name
          <input name="fullName" defaultValue={v.fullName} required minLength={2} maxLength={100} autoComplete="name" className={field} />
        </label>
        <label className={label}>
          Preferred name <span className={hint}>What {self ? "you like" : "they like"} to be called, if different</span>
          <input name="preferredName" defaultValue={v.preferredName} maxLength={50} autoComplete="nickname" className={field} />
        </label>
        <label className={label}>
          Job title
          <input name="jobTitle" defaultValue={v.jobTitle} maxLength={80} autoComplete="organization-title" className={field} />
        </label>
        <label className={label}>
          Phone
          <input name="phone" type="tel" defaultValue={v.phone} maxLength={20} placeholder="+234 803 123 4567" autoComplete="tel" className={field} />
        </label>
      </Section>

      <Section title="Personal" hint="Only you and super admins can see these.">
        <label className={label}>
          Date of birth
          <input name="dateOfBirth" type="date" defaultValue={v.dateOfBirth} max={maxBirth} autoComplete="bday" className={field} />
        </label>
        <label className={label}>
          Gender
          <select name="gender" defaultValue={v.gender} className={field}>
            <option value="">Choose…</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Nationality
          <CountrySelect name="nationality" defaultValue={v.nationality} countries={countries} />
        </label>
        <div className="hidden sm:block" />
        <label className={`${label} sm:col-span-2`}>
          Home address
          <input name="addressLine" defaultValue={v.addressLine} maxLength={200} autoComplete="street-address" className={field} />
        </label>
        <label className={label}>
          City
          <input name="city" defaultValue={v.city} maxLength={80} autoComplete="address-level2" className={field} />
        </label>
        <label className={label}>
          State / region
          <input name="state" defaultValue={v.state} maxLength={80} autoComplete="address-level1" className={field} />
        </label>
        <label className={label}>
          Country
          <CountrySelect name="country" defaultValue={v.country} countries={countries} />
        </label>
      </Section>

      <Section title="Emergency contact" hint="Someone we can call if something happens at work. Give a name and number, or leave it all empty.">
        <label className={label}>
          Name
          <input name="emergencyName" defaultValue={v.emergencyName} maxLength={100} className={field} />
        </label>
        <label className={label}>
          Relationship
          <input name="emergencyRelationship" defaultValue={v.emergencyRelationship} maxLength={50} placeholder="e.g. Sister, Spouse" className={field} />
        </label>
        <label className={label}>
          Phone
          <input name="emergencyPhone" type="tel" defaultValue={v.emergencyPhone} maxLength={20} className={field} />
        </label>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("inverse", "md")}
        >
          {pending ? "Saving…" : "Save details"}
        </button>
        <span aria-live="polite" className="text-sm">
          {state?.error && <span className="text-danger">{state.error}</span>}
          {state?.message && <span className="text-success">{state.message}</span>}
        </span>
      </div>
    </form>
  );
}
