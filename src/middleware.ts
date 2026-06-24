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
  let role: "membre" | "animateur" | "bureau" | null = null;
  let magasinId: string | undefined;
  try {
    const parsed = JSON.parse(sessionCookie.value);
    role = parsed?.role ?? null;
    magasinId = parsed?.magasinId ?? undefined;
  } catch {
    // Cookie corrompu → redirige vers login pour reset
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Espace par défaut selon le rôle
  const espace =
    role === "animateur" ? "/animateur"
    : role === "bureau" ? "/bureau"
    : magasinId ? `/membre/${magasinId}` : "/membre";

  // Racine "/" : un utilisateur connecté va DIRECTEMENT dans son espace.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = espace;
    return NextResponse.redirect(url);
  }

  // BUREAU : périmètre lecture seule étendu. Tout le reste → renvoyé sur /bureau.
  if (role === "bureau") {
    // Pages animateur jamais accessibles au bureau (restent animateur seul)
    const BUREAU_NEVER = [
      "/animateur/parametres",
      "/animateur/comptes",
      "/animateur/visibilite",
      "/animateur/disponibilites",
      "/animateur/fonctionnalites",
    ];
    if (isPrefixMatch(pathname, BUREAU_NEVER)) {
      const url = req.nextUrl.clone();
      url.pathname = "/bureau";
      return NextResponse.redirect(url);
    }
    // Pages accessibles au bureau (guardBureau gère le toggle fin par fonctionnalité)
    const BUREAU_ALLOWED = [
      "/bureau", "/pilotage",
      "/animateur",       // dashboard + sous-pages (sauf BUREAU_NEVER ci-dessus)
      "/visites",
      "/actions-reseau",
      "/remontees",
      "/evaluations",
      "/magasins",
    ];
    if (isPrefixMatch(pathname, BUREAU_ALLOWED)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/bureau";
    return NextResponse.redirect(url);
  }

  // /bureau réservé au bureau (et à l'animateur). Un membre est renvoyé chez lui.
  if (isPrefixMatch(pathname, ["/bureau"]) && role !== "animateur") {
    const url = req.nextUrl.clone();
    url.pathname = espace;
    return NextResponse.redirect(url);
  }

  // Protection par rôle (animateur / membre)
  if (isPrefixMatch(pathname, ANIMATEUR_PREFIXES) && role !== "animateur") {
    const url = req.nextUrl.clone();
    url.pathname = "/membre";
    return NextResponse.redirect(url);
  }
  if (isPrefixMatch(pathname, MEMBRE_PREFIXES) && role !== "membre") {
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
