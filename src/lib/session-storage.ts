/**
 * Session storage utilities for managing 24-hour auth session expiry.
 * Stores session token and expiry timestamp in localStorage.
 */

const SESSION_KEY = "auth_session";
const EXPIRY_KEY = "auth_expiry";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function saveSession(token: string): void {
  if (typeof window === "undefined") return; // SSR safety
  const expiryTime = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_KEY, token);
  localStorage.setItem(EXPIRY_KEY, expiryTime.toString());
}

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);

  if (!token || !expiry) return null;

  const expiryTime = parseInt(expiry, 10);
  if (Date.now() > expiryTime) {
    // Session expired
    clearSession();
    return null;
  }

  return token;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function isSessionExpired(): boolean {
  if (typeof window === "undefined") return true;
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
}

export function getSessionRemainingTime(): number {
  if (typeof window === "undefined") return 0;
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!expiry) return 0;
  const remaining = parseInt(expiry, 10) - Date.now();
  return remaining > 0 ? remaining : 0;
}
