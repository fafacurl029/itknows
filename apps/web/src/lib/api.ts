export type User = { id: string; email: string; name?: string | null; roles: string[] };

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const body = await res.json();
      msg = body?.error?.message || body?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  bootstrapStatus: () => request<{ needsSetup: boolean }>("/api/auth/bootstrap/status"),
  bootstrap: (payload: { email: string; password: string; name?: string }) =>
    request<{ user: User }>("/api/auth/bootstrap", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  me: () => request<{ user: User }>("/api/auth/me"),

  listSpaces: () => request<any>("/api/spaces"),
  createSpace: (payload: { name: string; description?: string }) =>
    request<any>("/api/spaces", { method: "POST", body: JSON.stringify(payload) }),

  createCollection: (payload: { spaceId: string; name: string; description?: string }) =>
    request<any>("/api/collections", { method: "POST", body: JSON.stringify(payload) }),

  listArticles: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/articles?${qs}`);
  },

  getArticle: (id: string) => request<any>(`/api/articles/${id}`),

  createArticle: (payload: any) => request<any>("/api/articles", { method: "POST", body: JSON.stringify(payload) }),

  updateArticle: (id: string, payload: any) =>
    request<any>(`/api/articles/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  restoreArticleVersion: (id: string, versionNumber: number) =>
    request<any>(`/api/articles/${id}/restore/${versionNumber}`, { method: "POST" }),

  addComment: (id: string, payload: { body: string }) =>
    request<any>(`/api/articles/${id}/comments`, { method: "POST", body: JSON.stringify(payload) }),

  audit: () => request<any>("/api/audit"),

  adminUsers: () => request<any>("/api/admin/users"),
  adminUpdateRoles: (id: string, roles: string[]) =>
    request<any>(`/api/admin/users/${id}/roles`, { method: "PATCH", body: JSON.stringify({ roles }) }),
};
