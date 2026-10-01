"use client";

import { startTransition, useActionState } from "react";
import { saveStaffProfile } from "@/lib/actions/staff-profile";
import { GENDERS } from "@/lib/staff-profile";
import type { StaffProfileView } from "@/lib/staff-profiles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import { PhoneInput } from "@/components/ui/phone-input";

const label = "flex-col items-stretch gap-1.5";
const hint = "text-xs font-normal text-muted-foreground";

function Section({ title, hint: note, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid grid-cols-1 gap-4 border-t border-border pt-5 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-8">
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
    <FormSelect name={name} defaultValue={defaultValue} emptyLabel="Not set" options={countries.map((c) => ({ value: c.code, label: c.name }))} />
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
      className="flex flex-col gap-6 rounded-[6px] border border-border bg-card p-5 sm:p-6"
    >
      <Section title="Basics">
        <Label className={label}>
          Full name
          <Input name="fullName" defaultValue={v.fullName} required minLength={2} maxLength={100} autoComplete="name" />
        </Label>
        <Label className={label}>
          Preferred name <span className={hint}>What {self ? "you like" : "they like"} to be called, if different</span>
          <Input name="preferredName" defaultValue={v.preferredName} maxLength={50} autoComplete="nickname" />
        </Label>
        <Label className={label}>
          Job title
          <Input name="jobTitle" defaultValue={v.jobTitle} maxLength={80} autoComplete="organization-title" />
        </Label>
        <Label className={label}>
          Phone
          <PhoneInput name="phone" defaultValue={v.phone} maxLength={20} placeholder="+234 803 123 4567" />
        </Label>
      </Section>

      <Section title="Personal" hint="Only you and super admins can see these.">
        <Label className={label}>
          Date of birth
          <Input name="dateOfBirth" type="date" defaultValue={v.dateOfBirth} max={maxBirth} autoComplete="bday" />
        </Label>
        <Label className={label}>
          Gender
          <FormSelect name="gender" defaultValue={v.gender} emptyLabel="Not set" options={GENDERS.map((g) => ({ value: g.value, label: g.label }))} />
        </Label>
        <Label className={label}>
          Nationality
          <CountrySelect name="nationality" defaultValue={v.nationality} countries={countries} />
        </Label>
        <div className="hidden sm:block" />
        <Label className={`${label} sm:col-span-2`}>
          Home address
          <Input name="addressLine" defaultValue={v.addressLine} maxLength={200} autoComplete="street-address" />
        </Label>
        <Label className={label}>
          City
          <Input name="city" defaultValue={v.city} maxLength={80} autoComplete="address-level2" />
        </Label>
        <Label className={label}>
          State / region
          <Input name="state" defaultValue={v.state} maxLength={80} autoComplete="address-level1" />
        </Label>
        <Label className={label}>
          Country
          <CountrySelect name="country" defaultValue={v.country} countries={countries} />
        </Label>
      </Section>

      <Section title="Emergency contact" hint="Someone we can call if something happens at work. Give a name and number, or leave it all empty.">
        <Label className={label}>
          Name
          <Input name="emergencyName" defaultValue={v.emergencyName} maxLength={100} />
        </Label>
        <Label className={label}>
          Relationship
          <Input name="emergencyRelationship" defaultValue={v.emergencyRelationship} maxLength={50} placeholder="e.g. Sister, Spouse" />
        </Label>
        <Label className={label}>
          Phone
          <PhoneInput name="emergencyPhone" defaultValue={v.emergencyPhone} maxLength={20} autoComplete="off" />
        </Label>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button
          type="submit"
          disabled={pending}
          variant="ink"
        >
          {pending ? "Saving…" : "Save details"}
        </Button>
        <span aria-live="polite" className="text-sm">
          {state?.error && <span className="text-destructive">{state.error}</span>}
          {state?.message && <span className="text-emerald">{state.message}</span>}
        </span>
      </div>
    </form>
  );
}
