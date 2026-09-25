import "server-only";
import { cookies } from "next/headers";

// The partner's name from sign-up, held until the couple creates their wedding.
// A cookie keeps it out of the URL and avoids a database column for one step.
const PARTNER_COOKIE = "onboarding_partner";
const MAX_AGE = 7 * 24 * 60 * 60;

export async function rememberPartnerName(name: string) {
  (await cookies()).set(PARTNER_COOKIE, name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/dashboard",
    maxAge: MAX_AGE,
  });
}

export async function getPartnerName() {
  return (await cookies()).get(PARTNER_COOKIE)?.value ?? "";
}

export async function forgetPartnerName() {
  (await cookies()).delete({ name: PARTNER_COOKIE, path: "/dashboard" });
}
