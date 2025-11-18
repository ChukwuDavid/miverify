// Simple client-side verification state helper.
// Stores a per-user verified flag in localStorage under `verified_<uid>`.

export function isUserVerified(uid?: string | null): boolean {
  if (!uid) return false;
  try {
    return localStorage.getItem(`verified_${uid}`) === "1";
  } catch {
    return false;
  }
}

export function markUserVerified(uid: string): void {
  try {
    localStorage.setItem(`verified_${uid}`, "1");
  } catch {
    // ignore
  }
}

export function clearUserVerified(uid: string): void {
  try {
    localStorage.removeItem(`verified_${uid}`);
  } catch (_e) {
    // ignore
  }
}
