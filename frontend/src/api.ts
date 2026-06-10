// In dev, use same-origin /api (Vite proxies to localhost:3000) to avoid CORS blocking POST.
// Set VITE_API_BASE=http://localhost:3000 to call the backend directly.
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? "" : "http://localhost:3000");

type ApiErrorBody = {
  error?: { message?: string };
};

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token: string): void {
  localStorage.setItem("accessToken", token);
}

export function clearAccessToken(): void {
  localStorage.removeItem("accessToken");
}

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export { parseCommaList };

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("You are not logged in. Please log in first.");
    }
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: requestHeaders
  });

  const body = (await response.json()) as T & ApiErrorBody;

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearAccessToken();
      window.location.assign("/login?session=expired");
      throw new Error("Your session has expired. Please log in again.");
    }

    const message = body.error?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}
