import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/robots.txt",
  "/favicon.ico",
];

const PUBLIC_PREFIXES = ["/evaluation/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisse passer les chemins publics
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Vérifie le cookie de session
  const session = req.cookies.get("pa_session");
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|auth/callback|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|woff|woff2|ttf)).*)",
  ],
};
