const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("gamehub-token")
    : null;

  const requestOptions: RequestInit = { ...options };
  if (requestOptions.signal instanceof AbortSignal) {
    requestOptions.signal = requestOptions.signal;
  } else {
    delete requestOptions.signal;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Não foi possível concluir a requisição.");
  }

  return response.json() as Promise<T>;
}
