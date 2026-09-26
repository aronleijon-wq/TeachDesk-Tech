// Where to take someone once they're signed in. Signing in with Google leaves the site and
// comes back to the front page, and a new account is confirmed from a link in an email, so
// the destination (e.g. an invitation) is remembered in the browser for a while.

const KEY = "teachdesk:after-sign-in";
const REMEMBER_MS = 24 * 60 * 60 * 1000;

/** The path if it's a page inside TeachDesk that sign-in may lead to — never another site. */
export function safeReturnPath(value: unknown): string | undefined {
  return typeof value === "string" && /^\/(app|invite)(\/|\?|$)/.test(value) ? value : undefined;
}

export function rememberReturnPath(path: string, now = Date.now()) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ path, until: now + REMEMBER_MS }));
  } catch {
    // Storage blocked: they'll land on the front page and can continue from there.
  }
}

/** The remembered path, once: it's forgotten as soon as it's read. */
export function takeReturnPath(now = Date.now()): string | undefined {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    window.localStorage.removeItem(KEY);
    const saved = JSON.parse(raw) as { path?: unknown; until?: unknown };
    return typeof saved.until === "number" && saved.until > now
      ? safeReturnPath(saved.path)
      : undefined;
  } catch {
    return undefined;
  }
}
