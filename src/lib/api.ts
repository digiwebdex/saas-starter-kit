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

// ── Generic CRUD factory ──
function createCrudApi<T extends { id: string }>(resource: string) {
  return {
    list: () => request<T[]>(`/${resource}`),
    get: (id: string) => request<T>(`/${resource}/${id}`),
    create: (data: Omit<T, "id" | "tenantId" | "createdAt">) =>
      request<T>(`/${resource}`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<T>) =>
      request<T>(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/${resource}/${id}`, { method: "DELETE" }),
  };
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

// ── Dashboard Stats ──
export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
  recentPayments: Payment[];
}

export const dashboardApi = {
  getStats: () => request<DashboardStats>("/dashboard/stats"),
};

// ── Resource APIs ──
export const clientApi = {
  ...createCrudApi<Client>("clients"),
  getBookings: (id: string) => request<Booking[]>(`/clients/${id}/bookings`),
  getInvoices: (id: string) => request<Invoice[]>(`/clients/${id}/invoices`),
  getPayments: (id: string) => request<Payment[]>(`/clients/${id}/payments`),
  uploadDocument: (id: string, data: FormData) =>
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/clients/${id}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: data,
    }).then((r) => r.json()),
};
export const agentApi = createCrudApi<Agent>("agents");
export const vendorApi = createCrudApi<Vendor>("vendors");
export const leadApi = {
  ...createCrudApi<Lead>("leads"),
  updateStatus: (id: string, status: string) =>
    request<Lead>(`/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getActivities: (id: string) =>
    request<LeadActivity[]>(`/leads/${id}/activities`),
  addActivity: (id: string, data: { type: string; content: string }) =>
    request<LeadActivity>(`/leads/${id}/activities`, { method: "POST", body: JSON.stringify(data) }),
  convertToClient: (id: string) =>
    request<Client>(`/leads/${id}/convert`, { method: "POST" }),
};
export const taskApi = createCrudApi<Task>("tasks");
export const bookingApi = createCrudApi<Booking>("bookings");
export const invoiceApi = createCrudApi<Invoice>("invoices");
export const paymentApi = createCrudApi<Payment>("payments");
export const accountApi = createCrudApi<Account>("accounts");
export const transactionApi = createCrudApi<Transaction>("transactions");
export const subscriptionApi = createCrudApi<Subscription>("subscriptions");
export const paymentRequestApi = createCrudApi<PaymentRequest>("payment-requests");

// ── Types ──
export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "tenant_owner" | "manager" | "sales_agent" | "accountant" | "operations" | "owner" | "admin" | "member";
  tenantId: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerId: string;
  subscriptionPlan: "free" | "basic" | "pro" | "business" | "enterprise";
  subscriptionExpiry?: string;
  subscriptionStatus?: "active" | "expired" | "cancelled" | "pending";
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  alternatePhone?: string;
  address?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nidNumber?: string;
  nationality?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  tags?: string[];
  documents?: ClientDocument[];
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientDocument {
  id: string;
  clientId: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  tenantId: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  tenantId: string;
  createdAt: string;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "quoted" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: LeadStatus;
  source?: string;
  destination?: string;
  travelDateFrom?: string;
  travelDateTo?: string;
  travelerCount?: number;
  budget?: number;
  assignedTo?: string;
  assignedToName?: string;
  nextFollowUp?: string;
  notes?: string;
  tags?: string[];
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: "note" | "status_change" | "follow_up" | "call" | "email" | "meeting";
  content: string;
  oldStatus?: LeadStatus;
  newStatus?: LeadStatus;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assignedTo?: string;
  tenantId: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  type: "tour" | "ticket" | "hotel" | "visa";
  clientId: string;
  agentId: string;
  amount: number;
  cost: number;
  profit: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  tenantId: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: "unpaid" | "partial" | "paid";
  tenantId: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  bookingId: string;
  amount: number;
  method: "cash" | "bank";
  date: string;
  tenantId: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: "cash" | "bank";
  balance: number;
  tenantId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  referenceId: string;
  date: string;
  tenantId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: "free" | "basic" | "pro" | "business";
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "pending" | "cancelled";
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  tenantId: string;
  plan: string;
  amount: number;
  trxId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
