import { API_URL } from "@/utils/api";

export async function requestJson<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function getJson<T>(path: string, token?: string | null): Promise<T> {
  return requestJson<T>(path, { method: "GET" }, token);
}
