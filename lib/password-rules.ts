// Password requirements and strength, shared by the create-password forms and the server.

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

export const PASSWORD_RULES = [
  { id: "length", label: `At least ${MIN_PASSWORD_LENGTH} characters`, fix: `Use at least ${MIN_PASSWORD_LENGTH} characters`, test: /^[\s\S]{8,}$/ },
  { id: "lower", label: "A lowercase letter", fix: "Add a lowercase letter", test: /[a-z]/ },
  { id: "upper", label: "An uppercase letter", fix: "Add an uppercase letter", test: /[A-Z]/ },
  { id: "number", label: "A number", fix: "Add a number", test: /\d/ },
  { id: "symbol", label: "A symbol, like ! or #", fix: "Add a symbol, like ! or #", test: /[^A-Za-z0-9\s]/ },
] as const;

/** Every rule at once: 8–200 characters with a lowercase, uppercase, number and symbol. */
export const PASSWORD_REGEX = /^(?=[\s\S]*[a-z])(?=[\s\S]*[A-Z])(?=[\s\S]*\d)(?=[\s\S]*[^A-Za-z0-9\s])[\s\S]{8,200}$/;

// Patterns attackers try first; they drag the strength down even when the rules pass.
const WEAK_PATTERNS = [
  /password|passw0rd|p@ssw0rd|qwerty|letmein|welcome|admin|wedding|iloveyou/i,
  /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde)/i,
  /(.)\1{2,}/, // aaa, 111
];

export type PasswordStrength = {
  /** 0 (empty) to 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: "" | "Weak" | "Fair" | "Good" | "Strong";
  rules: { id: string; label: string; met: boolean }[];
  valid: boolean;
};

export function passwordStrength(password: string): PasswordStrength {
  const rules = PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, met: r.test.test(password) }));
  const valid = PASSWORD_REGEX.test(password);
  if (!password) return { score: 0, label: "", rules, valid };

  let points = rules.filter((r) => r.met).length; // 0–5
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;
  if (WEAK_PATTERNS.some((p) => p.test(password))) points -= 2;

  // Missing a rule caps it at Fair. Meeting every rule rates Good or Strong, unless
  // the password is predictable (e.g. "Password123!"), which rates Fair.
  const score = !valid ? (points >= 4 ? 2 : 1) : points >= 7 ? 4 : points >= 5 ? 3 : 2;
  const label = (["", "Weak", "Fair", "Good", "Strong"] as const)[score];
  return { score: score as PasswordStrength["score"], label, rules, valid };
}

/** Server-side check for new passwords: the first unmet rule, or null when it's acceptable. */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || !password) return PASSWORD_RULES[0].fix;
  if (password.length > MAX_PASSWORD_LENGTH) return "That password is too long";
  const missing = PASSWORD_RULES.find((r) => !r.test.test(password));
  return missing ? missing.fix : null;
}

/** "an uppercase letter and a symbol": what a password still needs, for inline messages. */
export function missingRequirements(password: string): string | null {
  const missing = PASSWORD_RULES.filter((r) => !r.test.test(password)).map((r) =>
    r.id === "length" ? `at least ${MIN_PASSWORD_LENGTH} characters` : r.label.replace(/^A /, "a ").replace(/^An /, "an ")
  );
  if (missing.length === 0) return null;
  if (missing.length === 1) return missing[0];
  return `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
}
