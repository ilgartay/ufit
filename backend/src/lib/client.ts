"use client";

// Tarayıcı tarafı API yardımcıları. Personel JWT'si localStorage'da tutulur.

const TOKEN_KEY = "staff_token";
const STAFF_KEY = "staff_info";

export type StaffInfo = {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "STAFF";
};

export function setSession(token: string, staff: StaffInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStaff(): StaffInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STAFF_KEY);
  return raw ? (JSON.parse(raw) as StaffInfo) : null;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STAFF_KEY);
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    logout();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Oturum süresi doldu");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "İstek başarısız");
  }
  return data as T;
}
