import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Keep in sync with lib/geo.ts (which can't be imported here: it is server-only).
const GEO_BYPASS_PARAM = "access";
const GEO_BYPASS_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
const WEDDING_PATH = /^\/w\/([a-z0-9-]+)(?:\/|$)/;
const PROTECTED_PATH = /^\/(dashboard|super)(?:\/|$)/;

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Optimistic check only; pages and actions verify the session themselves.
  if (PROTECTED_PATH.test(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // A guest abroad unlocking a geo-restricted wedding with ?access=CODE: remember
  // the code for this wedding and drop it from the URL. The wedding layout checks
  // it against the database (lib/geo.ts).
  const wedding = pathname.match(WEDDING_PATH);
  const code = searchParams.get(GEO_BYPASS_PARAM);
  if (wedding && code !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(GEO_BYPASS_PARAM);
    const response = NextResponse.redirect(url);
    response.cookies.set(`geo-bypass-${wedding[1]}`, code.slice(0, 200), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: GEO_BYPASS_MAX_AGE,
      path: `/w/${wedding[1]}`,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/super/:path*", "/w/:path*"],
};
