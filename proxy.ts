import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Keep in sync with lib/geo.ts (which can't be imported here: it is server-only).
const GEO_BYPASS_PARAM = "access";
const GEO_BYPASS_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
const WEDDING_PATH = /^\/w\/([a-z0-9-]+)(?:\/|$)/;
const PROTECTED_PATH = /^\/(dashboard|super)(?:\/|$)/;
// Pages that belong to Vowly itself, never to a couple's domain.
const PLATFORM_PATH = /^\/(dashboard|super|login|signup|forgot-password|reset-password|pricing|api)(?:\/|$)/;

// ─── Custom domains: a couple's own domain serves their guest site. ──────────

const SITE_HOST = process.env.SITE_URL ? bareHost(new URL(process.env.SITE_URL).host) : null;
const DOMAIN_CACHE_MS = 60_000;
const domainCache = new Map<string, { slug: string | null; expires: number }>();

function bareHost(host: string) {
  return host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
}

function isPlatformHost(host: string) {
  return host === SITE_HOST || host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

/** The wedding slug for a connected domain, cached briefly (misses too) so most requests skip the database. */
async function slugForDomain(host: string) {
  const hit = domainCache.get(host);
  if (hit && hit.expires > Date.now()) return hit.slug;
  const wedding = await prisma.wedding.findUnique({ where: { customDomain: host }, select: { slug: true } });
  if (domainCache.size > 1000) domainCache.clear();
  domainCache.set(host, { slug: wedding?.slug ?? null, expires: Date.now() + DOMAIN_CACHE_MS });
  return wedding?.slug ?? null;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const host = bareHost(request.headers.get("host") ?? "");
  if (host && !isPlatformHost(host)) {
    const slug = await slugForDomain(host).catch(() => null);
    if (slug) return serveCustomDomain(request, slug);
  }

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

/**
 * On a couple's domain, "/" is their guest site and "/gallery" its gallery;
 * Vowly's own pages (sign-in, dashboard) go back to the main site.
 */
function serveCustomDomain(request: NextRequest, slug: string) {
  const { pathname, searchParams } = request.nextUrl;

  if (PLATFORM_PATH.test(pathname) && process.env.SITE_URL) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, process.env.SITE_URL));
  }

  // Same geo-bypass handling as below, with the cookie on the whole domain.
  const code = searchParams.get(GEO_BYPASS_PARAM);
  if (code !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(GEO_BYPASS_PARAM);
    const response = NextResponse.redirect(url);
    response.cookies.set(`geo-bypass-${slug}`, code.slice(0, 200), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: GEO_BYPASS_MAX_AGE,
      path: "/",
    });
    return response;
  }

  // Links inside the site use /w/<slug>/…, which already resolve as they are.
  if (pathname.startsWith(`/w/${slug}`)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/w/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Every page, so a couple's own domain can be served; static files are skipped.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|images/|robots.txt|sitemap.xml).*)"],
};
