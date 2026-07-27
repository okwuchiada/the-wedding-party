import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";

export const verifySession = cache(async () => {
  const cookie = await getSessionCookie();
  const session = await decrypt(cookie);

  if (!session?.role) {
    redirect("/admin/login");
  }

  return { isAuth: true as const, role: session.role };
});
