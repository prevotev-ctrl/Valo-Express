// Simple local-only session helpers (client-side usage)
export type Session = { email: string; name?: string };

export function setSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem("session", JSON.stringify(s));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("session");
}

