import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/robots.txt",
  "/favicon.ico",
];

// Pages publiques : formulaire d'évaluation envoyé aux magasins via lien partagé
const PUBLIC_PREFIXES = ["/evaluation/"];

// Routes réservées aux animateurs (admin / pilotage)
const ANIMATEUR_PREFIXES = [
  "/animateur",
  "/pilotage",
  "/magasins",
  "/visites",
  "/actions-reseau",
  "/remontees",
  "/evaluations",
];

// Routes réservées aux membres (leur propre fiche)
const MEMBRE_PREFIXES = ["/membre"];

function isPrefixMatch(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisse passer les chemins publics
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }
  if (isPrefixMatch(pathname, PUBLIC_PREFIXES)) {
    return NextResponse.next();
  }

  // Vérifie le cookie de session
  const sessionCookie = req.cookies.get("pa_session");
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Parse le rôle depuis le cookie
  let role: "membre" | "animateur" | null = null;
  try {
    const parsed = JSON.parse(sessionCookie.value);
    role = parsed?.role ?? null;
  } catch {
    // Cookie corrompu → redirige vers login pour reset
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protection par rôle
  if (isPrefixMatch(pathname, ANIMATEUR_PREFIXES) && role !== "animateur") {
    // Un membre essaie d'accéder à une page animateur → renvoyé sur sa fiche
    const url = req.nextUrl.clone();
    url.pathname = "/membre";
    return NextResponse.redirect(url);
  }
  if (isPrefixMatch(pathname, MEMBRE_PREFIXES) && role !== "membre") {
    // Un animateur essaie d'accéder à la fiche membre → renvoyé sur son dashboard
    const url = req.nextUrl.clone();
    url.pathname = "/animateur";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|auth/callback|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|html|woff|woff2|ttf)).*)",
  ],
};
