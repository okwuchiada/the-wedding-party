// Staff biodata: the fields, their labels and validation. Pure, so the form, the
// server action and tests share one set of rules.

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export type StaffProfileInput = {
  fullName: string;
  preferredName: string | null;
  jobTitle: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  nationality: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  emergencyName: string | null;
  emergencyRelationship: string | null;
  emergencyPhone: string | null;
};

/** Field names as people read them, for the audit log and messages. */
export const FIELD_LABELS: Record<keyof StaffProfileInput, string> = {
  fullName: "Full name",
  preferredName: "Preferred name",
  jobTitle: "Job title",
  phone: "Phone",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  nationality: "Nationality",
  addressLine: "Address",
  city: "City",
  state: "State / region",
  country: "Country",
  emergencyName: "Emergency contact name",
  emergencyRelationship: "Emergency contact relationship",
  emergencyPhone: "Emergency contact phone",
};

const PHONE = /^\+?[0-9 ()-]{7,20}$/;
/** Digits, spaces, brackets and dashes, optional leading +, at least 7 digits. */
export const phoneOk = (v: string) => PHONE.test(v) && v.replace(/\D/g, "").length >= 7;

/** Whole years between a date of birth and `today`. */
export function ageOn(dateOfBirth: Date, today = new Date()) {
  const age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dateOfBirth.getUTCMonth() ||
    (today.getUTCMonth() === dateOfBirth.getUTCMonth() && today.getUTCDate() < dateOfBirth.getUTCDate());
  return beforeBirthday ? age - 1 : age;
}

/**
 * Reads and checks the profile form. `countries` is the set of allowed country
 * codes. Returns the cleaned values, or the first problem in plain words.
 */
export function parseStaffProfile(
  get: (name: string) => unknown,
  countries: Set<string>,
  today = new Date()
): { data: StaffProfileInput; error?: undefined } | { error: string; data?: undefined } {
  const text = (name: string, max: number) => {
    const v = get(name);
    const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
    return s.length > max ? { tooLong: true as const } : s || null;
  };
  const fields: [keyof StaffProfileInput, number][] = [
    ["fullName", 100], ["preferredName", 50], ["jobTitle", 80], ["phone", 20], ["gender", 30], ["nationality", 2],
    ["addressLine", 200], ["city", 80], ["state", 80], ["country", 2], ["emergencyName", 100], ["emergencyRelationship", 50], ["emergencyPhone", 20],
  ];
  const v: Record<string, string | null> = {};
  for (const [name, max] of fields) {
    const value = text(name, max);
    if (value && typeof value === "object") return { error: `${FIELD_LABELS[name]} is too long (max ${max} characters)` };
    v[name] = value;
  }

  if (!v.fullName || v.fullName.length < 2) return { error: "Enter your full name" };
  if (v.phone && !phoneOk(v.phone)) return { error: "Enter a phone number with at least 7 digits, e.g. +234 803 123 4567" };
  if (v.gender && !GENDERS.some((g) => g.value === v.gender)) return { error: "Choose a gender from the list" };
  for (const name of ["nationality", "country"] as const) {
    if (v[name]) v[name] = v[name]!.toUpperCase();
    if (v[name] && !countries.has(v[name]!)) return { error: `Choose a ${name === "country" ? "country" : "nationality"} from the list` };
  }

  let dateOfBirth: Date | null = null;
  const dob = get("dateOfBirth");
  if (typeof dob === "string" && dob.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim()) || Number.isNaN(Date.parse(`${dob.trim()}T00:00:00Z`))) return { error: "Enter a valid date of birth" };
    dateOfBirth = new Date(`${dob.trim()}T00:00:00Z`);
    const age = ageOn(dateOfBirth, today);
    if (age < 16 || age > 100) return { error: "Check the date of birth: staff must be 16 or older" };
  }

  // An emergency contact needs at least a name and a number to be useful.
  if (v.emergencyName || v.emergencyPhone || v.emergencyRelationship) {
    if (!v.emergencyName || !v.emergencyPhone) return { error: "Give the emergency contact's name and phone number" };
    if (!phoneOk(v.emergencyPhone)) return { error: "Enter an emergency contact phone number with at least 7 digits" };
  }

  return { data: { ...(v as Omit<StaffProfileInput, "dateOfBirth">), fullName: v.fullName, dateOfBirth } };
}

/** Which fields differ, by name, so the audit log records what changed without the values. */
export function changedFields(before: Partial<Record<keyof StaffProfileInput, unknown>>, after: StaffProfileInput) {
  const norm = (x: unknown) => (x instanceof Date ? x.toISOString().slice(0, 10) : (x ?? null));
  return (Object.keys(after) as (keyof StaffProfileInput)[]).filter((k) => norm(before[k]) !== norm(after[k]));
}
