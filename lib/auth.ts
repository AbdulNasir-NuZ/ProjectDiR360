"use client";

const TOKEN_KEY = "dire_auth_token";
const USER_KEY = "dire_auth_user";

export type StoredUser = {
  email: string;
  walletAddress?: string;
  fullName?: string;
};

export function setAuth(token: string, user: StoredUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function updateStoredUser(partial: Partial<StoredUser>) {
  if (typeof window === "undefined") return;
  const current = getStoredUser();
  if (!current) return;
  const next = { ...current, ...partial };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
}
