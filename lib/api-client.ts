const API_SECRET_STORAGE_KEY = "cricket-api-secret-v1";

export function getStoredApiSecret(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_SECRET_STORAGE_KEY)?.trim() ?? "";
}

export function setStoredApiSecret(secret: string): void {
  if (typeof window === "undefined") return;
  const trimmed = secret.trim();
  if (trimmed) {
    localStorage.setItem(API_SECRET_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(API_SECRET_STORAGE_KEY);
  }
}

export function withApiAuthHeaders(
  headers: HeadersInit = {}
): Record<string, string> {
  const base =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : Array.isArray(headers)
        ? Object.fromEntries(headers)
        : { ...headers };

  const secret = getStoredApiSecret();
  if (secret) {
    base.Authorization = `Bearer ${secret}`;
  }
  return base as Record<string, string>;
}

export async function authenticatedFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...withApiAuthHeaders(init?.headers),
    },
  });
}
