import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("admin_session")?.value;
  const session = await decrypt(cookie);

  if (!session?.role) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
