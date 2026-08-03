const API_TOKEN_REFRESH_SKEW_MS = 60_000;

let cachedToken: { value: string; expiresAt: number } | null = null;
let tokenProvider: (() => Promise<string | null>) | null = null;

export function setApiTokenProvider(
  provider: (() => Promise<string | null>) | null
) {
  tokenProvider = provider;
  cachedToken = null;
}

export function clearApiTokenCache() {
  cachedToken = null;
}

async function resolveAccessToken(): Promise<string | null> {
  if (!tokenProvider) return null;
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + API_TOKEN_REFRESH_SKEW_MS) {
    return cachedToken.value;
  }
  const token = await tokenProvider();
  if (!token) {
    cachedToken = null;
    return null;
  }
  // Firebase ID tokens last ~1 hour; refresh via provider when stale.
  cachedToken = { value: token, expiresAt: now + 55 * 60 * 1000 };
  return token;
}

export async function withApiAuthHeaders(
  headers: HeadersInit = {}
): Promise<Record<string, string>> {
  const base =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : Array.isArray(headers)
        ? Object.fromEntries(headers)
        : { ...headers };

  const token = await resolveAccessToken();
  if (token) {
    base.Authorization = `Bearer ${token}`;
  }
  return base as Record<string, string>;
}

export async function authenticatedFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const headers = await withApiAuthHeaders({
    "Content-Type": "application/json",
    ...init?.headers,
  });
  return fetch(path, {
    ...init,
    headers,
  });
}
