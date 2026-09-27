"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { passwordResetEmail, sendMail } from "@/lib/mail";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { takeRateLimit } from "@/lib/rate-limit";
import { rememberPartnerName } from "@/lib/onboarding";
import { getClientIp } from "@/lib/request";
import { createSession, deleteSession } from "@/lib/session";
import { createUserToken, findValidToken } from "@/lib/tokens";

export type AuthFormState = { error?: string; message?: string } | undefined;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Only same-site relative paths, so ?next= can't send people to another site. */
function safeNextPath(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("password");

  if (!email || typeof password !== "string" || !password) {
    return { error: "Enter your email and password" };
  }

  const ip = await getClientIp();
  const allowed =
    (await takeRateLimit("login:ip", ip, 50, 15 * MINUTE)) &&
    (await takeRateLimit("login:email", email, 10, 15 * MINUTE));
  if (!allowed) return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!(await verifyPassword(user?.passwordHash, password)) || !user) {
    return { error: "Incorrect email or password" };
  }

  await createSession(user);
  // Staff start in the console; couples in their dashboard.
  redirect(safeNextPath(formData.get("next"), can(user.role, "console.view") ? "/super" : "/dashboard"));
}

export async function signup(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = formData.get("name");
  const partnerName = formData.get("partnerName");
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("password");

  if (typeof name !== "string" || !name.trim()) return { error: "Please enter your name" };
  if (typeof partnerName !== "string" || !partnerName.trim()) return { error: "Please enter your partner's name" };
  if (name.trim().length > 80 || partnerName.trim().length > 80) return { error: "Names can be up to 80 characters" };
  if (!EMAIL_REGEX.test(email)) return { error: "Please enter a valid email" };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };
  if (formData.get("agreedToTerms") !== "on") {
    return { error: "Please agree to the Terms of Service and Privacy Policy to continue." };
  }

  if (!(await takeRateLimit("signup:ip", await getClientIp(), 5, HOUR))) {
    return { error: "Too many sign-ups from your network. Please try again later." };
  }

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "An account with this email already exists. Try signing in instead." };
  }

  const user = await prisma.user.create({
    data: { name: name.trim(), email, passwordHash: await hashPassword(password as string) },
  });

  await createSession(user);
  // Pre-fills "Let's set up your site" with both names.
  await rememberPartnerName(partnerName.trim());
  redirect("/dashboard/new");
}

export async function logout() {
  await deleteSession();
  redirect(LOGIN_PATH);
}

const RESET_SENT_MESSAGE = "If an account exists for that email, we've sent a link to reset the password.";

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  if (!EMAIL_REGEX.test(email)) return { error: "Please enter a valid email" };

  const allowed =
    (await takeRateLimit("reset:ip", await getClientIp(), 10, HOUR)) &&
    (await takeRateLimit("reset:email", email, 3, HOUR));
  // Same answer either way, so the form doesn't reveal which emails have accounts.
  if (!allowed) return { message: RESET_SENT_MESSAGE };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const token = await createUserToken(user.id, "RESET");
    await sendMail({ to: email, ...passwordResetEmail({ token }) });
  }

  return { message: RESET_SENT_MESSAGE };
}

/** Sets a password from an emailed reset or invite link, then signs the user in. */
export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = formData.get("password");
  const confirm = formData.get("confirm");

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };
  if (password !== confirm) return { error: "The passwords don't match" };

  const record = await findValidToken(formData.get("token"));
  if (!record) return { error: "This link has expired or was already used. Request a new one." };

  const passwordHash = await hashPassword(password as string);
  const [user] = await prisma.$transaction([
    // Bumping sessionVersion signs out every other session.
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  await createSession(user);
  redirect("/dashboard");
}
