import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_COUNTRY = "NG";
const BYPASS_COOKIE = "geo-bypass";
const BYPASS_PARAM = "access";
const BYPASS_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const BLOCKED_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unavailable</title>
    <style>
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        background: #faf6f0;
        color: #3a2e28;
        font-family: Georgia, serif;
        text-align: center;
      }
      p {
        max-width: 32rem;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <p>This site is currently unavailable in your country. Please reach out to us directly for more information.</p>
  </body>
</html>`;

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const bypassToken = process.env.GEO_BYPASS_TOKEN;
  const providedToken = searchParams.get(BYPASS_PARAM);

  if (bypassToken && providedToken === bypassToken) {
    const response = NextResponse.next();
    response.cookies.set(BYPASS_COOKIE, bypassToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: BYPASS_MAX_AGE,
      path: "/",
    });
    return response;
  }

  if (
    bypassToken &&
    request.cookies.get(BYPASS_COOKIE)?.value === bypassToken
  ) {
    return NextResponse.next();
  }

  const country = request.headers.get("x-vercel-ip-country");

  if (!country || country === ALLOWED_COUNTRY) {
    return NextResponse.next();
  }

  return new NextResponse(BLOCKED_HTML, {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
