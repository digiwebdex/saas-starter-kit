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
export const bookingApi = {
  ...createCrudApi<Booking>("bookings"),
  updateStatus: (id: string, status: BookingStatus) =>
    request<Booking>(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getSegments: (id: string) => request<BookingSegment[]>(`/bookings/${id}/segments`),
  addSegment: (id: string, data: Omit<BookingSegment, "id">) =>
    request<BookingSegment>(`/bookings/${id}/segments`, { method: "POST", body: JSON.stringify(data) }),
  deleteSegment: (id: string, segId: string) =>
    request<void>(`/bookings/${id}/segments/${segId}`, { method: "DELETE" }),
  getTravelers: (id: string) => request<BookingTraveler[]>(`/bookings/${id}/travelers`),
  addTraveler: (id: string, data: Omit<BookingTraveler, "id">) =>
    request<BookingTraveler>(`/bookings/${id}/travelers`, { method: "POST", body: JSON.stringify(data) }),
  deleteTraveler: (id: string, tId: string) =>
    request<void>(`/bookings/${id}/travelers/${tId}`, { method: "DELETE" }),
  getChecklist: (id: string) => request<BookingChecklistItem[]>(`/bookings/${id}/checklist`),
  updateChecklistItem: (id: string, itemId: string, done: boolean) =>
    request<BookingChecklistItem>(`/bookings/${id}/checklist/${itemId}`, { method: "PATCH", body: JSON.stringify({ done }) }),
  addChecklistItem: (id: string, data: { label: string }) =>
    request<BookingChecklistItem>(`/bookings/${id}/checklist`, { method: "POST", body: JSON.stringify(data) }),
  getTimeline: (id: string) => request<BookingTimelineEvent[]>(`/bookings/${id}/timeline`),
  addTimelineEvent: (id: string, data: { type: string; content: string }) =>
    request<BookingTimelineEvent>(`/bookings/${id}/timeline`, { method: "POST", body: JSON.stringify(data) }),
  getDocuments: (id: string) => request<BookingDocument[]>(`/bookings/${id}/documents`),
  uploadDocument: (id: string, data: FormData) =>
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/bookings/${id}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: data,
    }).then((r) => r.json()),
  deleteDocument: (id: string, docId: string) =>
    request<void>(`/bookings/${id}/documents/${docId}`, { method: "DELETE" }),
};
export const invoiceApi = createCrudApi<Invoice>("invoices");
export const paymentApi = createCrudApi<Payment>("payments");
export const accountApi = createCrudApi<Account>("accounts");
export const transactionApi = createCrudApi<Transaction>("transactions");
export const subscriptionApi = createCrudApi<Subscription>("subscriptions");
export const paymentRequestApi = createCrudApi<PaymentRequest>("payment-requests");

// ── Quotation API ──
export const quotationApi = {
  ...createCrudApi<Quotation>("quotations"),
  updateStatus: (id: string, status: QuotationStatus) =>
    request<Quotation>(`/quotations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getVersions: (id: string) =>
    request<QuotationVersion[]>(`/quotations/${id}/versions`),
  duplicate: (id: string) =>
    request<Quotation>(`/quotations/${id}/duplicate`, { method: "POST" }),
  convertToBooking: (id: string) =>
    request<Booking>(`/quotations/${id}/convert-to-booking`, { method: "POST" }),
};

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

export type BookingStatus = "pending" | "confirmed" | "ticketed" | "traveling" | "completed" | "cancelled";
export type BookingType = "tour" | "ticket" | "hotel" | "visa" | "package";

export interface Booking {
  id: string;
  type: BookingType;
  title?: string;
  clientId: string;
  clientName?: string;
  agentId: string;
  agentName?: string;
  quotationId?: string;
  destination?: string;
  travelDateFrom?: string;
  travelDateTo?: string;
  travelerCount?: number;
  amount: number;
  cost: number;
  profit: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus?: "unpaid" | "partial" | "paid";
  status: BookingStatus;
  assignedTo?: string;
  assignedToName?: string;
  supplierName?: string;
  supplierRef?: string;
  internalNotes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingSegment {
  id: string;
  bookingId?: string;
  type: "hotel" | "flight" | "transfer" | "visa" | "activity" | "package";
  description: string;
  supplier?: string;
  supplierRef?: string;
  startDate?: string;
  endDate?: string;
  details?: string;
  cost: number;
  sellingPrice: number;
  status?: "pending" | "confirmed" | "cancelled";
}

export interface BookingTraveler {
  id: string;
  bookingId?: string;
  name: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface BookingChecklistItem {
  id: string;
  bookingId?: string;
  label: string;
  done: boolean;
  doneAt?: string;
  doneBy?: string;
}

export interface BookingTimelineEvent {
  id: string;
  bookingId?: string;
  type: "status_change" | "note" | "payment" | "document" | "checklist" | "system";
  content: string;
  oldStatus?: string;
  newStatus?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface BookingDocument {
  id: string;
  bookingId?: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
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

// ── Quotation Types ──
export type QuotationStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export type QuotationItemType =
  | "hotel" | "flight" | "visa" | "transport" | "tour"
  | "activity" | "insurance" | "service_fee" | "discount" | "tax";

export interface QuotationItem {
  id: string;
  type: QuotationItemType;
  day?: number;
  description: string;
  details?: string;
  supplier?: string;
  costPrice: number;
  markupPercent: number;
  sellingPrice: number;
  quantity: number;
  nights?: number;
  subtotal: number;
}

export interface ItineraryDay {
  dayNumber: number;
  date?: string;
  title: string;
  description: string;
  meals?: string;
  accommodation?: string;
  activities?: string[];
}

export interface QuotationVersion {
  id: string;
  quotationId: string;
  versionNumber: number;
  snapshot: string;
  changeNote?: string;
  changedBy?: string;
  changedByName?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  title: string;
  clientId?: string;
  clientName?: string;
  leadId?: string;
  leadName?: string;
  destination: string;
  travelDateFrom?: string;
  travelDateTo?: string;
  travelerCount: number;
  status: QuotationStatus;
  version: number;
  items: QuotationItem[];
  itinerary: ItineraryDay[];
  totalCost: number;
  totalSelling: number;
  totalProfit: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy?: string;
  createdByName?: string;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}
