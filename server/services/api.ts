const API_URL = "http://localhost:5000/api";

export function getStoredToken(): string | null {
  try {
    const auth =
      localStorage.getItem("patriotAuth") ??
      sessionStorage.getItem(
        "patriotSessionAuth",
      );

    if (!auth) {
      return null;
    }

    const parsed = JSON.parse(auth);

    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getStoredToken();

  const headers = new Headers(
    options.headers,
  );

  headers.set(
    "Content-Type",
    "application/json",
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  return fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );
}