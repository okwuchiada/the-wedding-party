"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

function passwordsMatch(input: string, expected: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Please enter the password" };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { error: "Admin password isn't configured yet — set ADMIN_PASSWORD in .env" };
  }

  if (!passwordsMatch(password, adminPassword)) {
    return { error: "Incorrect password" };
  }

  await createSession();
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
