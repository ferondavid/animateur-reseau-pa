import { cookies } from "next/headers";

export type SessionRole = "membre" | "animateur";
export type Session = { role: SessionRole; cp?: string };

export const COOKIE_NAME = "pa_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  const c = await cookies();
  c.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
