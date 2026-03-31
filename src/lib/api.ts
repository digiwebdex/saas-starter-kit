// API service layer — point BASE_URL to your VPS backend
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
}

// ── Auth ──
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string; tenantName: string }) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => request<User>("/auth/me"),
};

// ── Tenants ──
export const tenantApi = {
  get: () => request<Tenant>("/tenants/me"),
  update: (data: Partial<Tenant>) =>
    request<Tenant>("/tenants/me", { method: "PATCH", body: JSON.stringify(data) }),
  getMembers: () => request<User[]>("/tenants/me/members"),
  inviteMember: (email: string, role: string) =>
    request<User>("/tenants/me/members", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),
  removeMember: (userId: string) =>
    request<void>(`/tenants/me/members/${userId}`, { method: "DELETE" }),
};

// ── Types ──
export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  tenantId: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerId: string;
  subscriptionPlan: "free" | "pro" | "enterprise";
  createdAt: string;
}
