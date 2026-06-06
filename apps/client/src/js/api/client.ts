import { ref } from "vue";

export const API_BASE = (import.meta.env.VITE_API_URL as string) ?? "/api";

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  let cleanPath = path;
  if (cleanPath.startsWith("/api")) {
    cleanPath = cleanPath.slice(4);
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  return `${API_BASE}${cleanPath}`;
}

export function getToken(): string | null {
  return localStorage.getItem("fintr_token");
}

export const isLoggedInReactive = ref(isAuthenticated());

export function setToken(token: string) {
  localStorage.setItem("fintr_token", token);
  isLoggedInReactive.value = true;
}

export function clearToken() {
  localStorage.removeItem("fintr_token");
  isLoggedInReactive.value = false;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUser(): { id: string; email: string; name: string; avatarUrl: string } | null {
  const raw = localStorage.getItem("fintr_user");
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: { id: string; email: string; name: string; avatarUrl: string }) {
  localStorage.setItem("fintr_user", JSON.stringify(user));
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        const err = new Error(json.message || json.error || errorMessage);
        if (json.code) (err as any).code = json.code;
        if (json.details) (err as any).details = json.details;
        (err as any).status = response.status;
        (err as any).responseJson = json;
        throw err;
      } else {
        errorMessage = await response.text();
      }
    } catch (e: any) {
      if (e.code || e.details) {
        throw e;
      }
      errorMessage = e.message || "Network error";
    }

    if (response.status === 401) {
      clearToken();
      localStorage.removeItem("fintr_user");
      // Redirect to login page
      window.location.href = "/";
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
