import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/modules/auth/infrastructure/authjs";

/**
 * Next.js middleware: edge-safe authentication + tenant routing.
 *
 * Responsibilities:
 *   1. Redirect anonymous users hitting `/app/*` to `/login`.
 *   2. Redirect authenticated users away from auth pages.
 *   3. Inject tenant + correlation headers for downstream observability.
 *
 * Heavy tenant validation (membership, role) lives in `requireTenantContext`
 * and runs in the Node.js runtime where Prisma is available. The middleware
 * only performs lightweight JWT-based decisions because Prisma cannot run on
 * the edge runtime.
 */

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/pricing",
  "/legal/terms",
  "/legal/privacy",
  "/legal/accessibility",
];

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/icons")) return true;
  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js") return true;
  return false;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isAuthed = !!req.auth?.user?.id;

  const correlationId = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-correlation-id", correlationId);

  if (isAuthed) {
    const orgId = (req.auth?.user as { activeOrganizationId?: string | null } | undefined)
      ?.activeOrganizationId;
    if (orgId) requestHeaders.set("x-tenant-id", orgId);
    requestHeaders.set("x-user-id", req.auth!.user!.id!);
  }

  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  const isProtected = pathname.startsWith("/app") || pathname.startsWith("/api/stories") ||
    pathname.startsWith("/api/export") || pathname.startsWith("/api/ai");

  if (isProtected && !isAuthed) {
    const loginUrl = new URL("/login", nextUrl);
    if (pathname !== "/app") loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isPublic(pathname) && !isProtected && !isAuthed && !isAuthPage) {
    // unknown private surface area — fall through, let route handler decide
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-correlation-id", correlationId);
  return res;
});

export const config = {
  matcher: [
    // Skip all internal paths (_next), static files, and PWA assets.
    "/((?!_next/static|_next/image|favicon.ico|icons/|screenshots/|sw.js|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
