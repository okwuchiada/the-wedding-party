import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_COUNTRY = "NG";
const BYPASS_COOKIE = "geo-bypass";
const BYPASS_PARAM = "access";
const BYPASS_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function renderBlockedHtml(showError: boolean) {
  return `<!doctype html>
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
      main {
        max-width: 32rem;
      }
      p {
        line-height: 1.6;
      }
      form {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 20px;
      }
      input {
        font-family: Georgia, serif;
        font-size: 1rem;
        padding: 10px 12px;
        border: 1px solid #cbb89d;
        border-radius: 4px;
        background: #fff;
        color: #3a2e28;
      }
      button {
        font-family: Georgia, serif;
        font-size: 1rem;
        padding: 10px 16px;
        border: 1px solid #3a2e28;
        border-radius: 4px;
        background: #3a2e28;
        color: #faf6f0;
        cursor: pointer;
      }
      .error {
        color: #a33b2c;
        margin-top: 12px;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <main>
      <p>This site is currently unavailable in your country. If you have an access code, please enter it below.</p>
      <form method="GET">
        <input type="text" name="${BYPASS_PARAM}" placeholder="Access code" autocomplete="off" required />
        <button type="submit">Enter</button>
      </form>
      ${showError ? `<p class="error">That code didn't work. Please try again or reach out to us directly.</p>` : ""}
    </main>
  </body>
</html>`;
}

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

  const showError = Boolean(providedToken);

  return new NextResponse(renderBlockedHtml(showError), {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
