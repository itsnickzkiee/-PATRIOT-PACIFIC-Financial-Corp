const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const API_URL = `${BASE_URL}/api`;

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
  const headers = new Headers(options.headers);

  if (
    options.body !== undefined &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const formattedEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  return fetch(
    `${API_URL}${formattedEndpoint}`,
    {
      ...options,
      headers,
    },
  );
}