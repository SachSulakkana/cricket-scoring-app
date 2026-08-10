import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session-constants";
import { routes, RETURN_TO_PARAM } from "@/lib/app-routes";

const PUBLIC_PATHS = [routes.login, routes.register] as const;

function isPublicPath(pathname: string): boolean {
  if ((PUBLIC_PATHS as readonly string[]).includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  // Firebase Auth handler proxied via next.config rewrites (Google redirect).
  if (pathname.startsWith("/__/auth")) return true;
  if (pathname.startsWith("/api/auth/session")) return true;
  // OBS / spectator overlays — auth via share key on data APIs
  if (pathname === routes.live || pathname.startsWith(`${routes.live}/`)) {
    return true;
  }
  if (pathname.startsWith("/api/live/")) return true;
  if (
    pathname === "/favicon.ico" ||
    pathname === "/logo.png" ||
    pathname === "/icon-32.png" ||
    pathname === "/apple-icon.png" ||
    pathname.startsWith("/qpl-logo")
  ) {
    return true;
  }
  return false;
}

const AUTH_DISABLED = process.env.AUTH_MODE?.trim().toLowerCase() === "none";

export function middleware(request: NextRequest) {
  if (AUTH_DISABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (
      session &&
      (pathname === routes.login || pathname === routes.register)
    ) {
      return NextResponse.redirect(new URL(routes.home, request.url));
    }
    return NextResponse.next();
  }

  // API routes (except session) require auth — verified fully in route handlers.
  // Still gate missing cookie early for page navigations.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!session) {
    const loginUrl = new URL(routes.login, request.url);
    const returnTo = `${pathname}${request.nextUrl.search}`;
    if (returnTo !== routes.home) {
      loginUrl.searchParams.set(RETURN_TO_PARAM, returnTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
