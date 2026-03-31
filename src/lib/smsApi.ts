// SMS API — calls backend SMS endpoints
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  });
}

export interface SmsConfig {
  provider: "sslwireless" | "bulksms";
  apiKey: string;
  senderId: string;
  baseUrl: string;
  enabled: boolean;
}

export type SmsLogStatus = "sent" | "failed" | "pending";

export interface SmsLog {
  id: string;
  phone: string;
  message: string;
  status: SmsLogStatus;
  provider: string;
  errorMessage?: string;
  templateId?: string;
  templateType?: string;
  sentAt: string;
  createdAt: string;
}

export interface SmsSendRequest {
  phone: string;
  message: string;
  templateId?: string;
}

export interface SmsSendResponse {
  success: boolean;
  messageId?: string;
  status: SmsLogStatus;
  error?: string;
}

export interface SmsBulkSendRequest {
  phones: string[];
  message: string;
  templateId?: string;
}

export interface SmsBulkSendResponse {
  total: number;
  sent: number;
  failed: number;
  results: { phone: string; success: boolean; error?: string }[];
}

export interface SmsLogFilters {
  status?: SmsLogStatus;
  phone?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const smsApi = {
  // ── Config ──
  getConfig: () => request<SmsConfig>("/sms/config"),
  updateConfig: (config: SmsConfig) =>
    request<SmsConfig>("/sms/config", { method: "PUT", body: JSON.stringify(config) }),

  // ── Send ──
  send: (data: SmsSendRequest) =>
    request<SmsSendResponse>("/sms/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendBulk: (data: SmsBulkSendRequest) =>
    request<SmsBulkSendResponse>("/sms/send-bulk", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  testSms: (phone: string) =>
    request<SmsSendResponse>("/sms/test", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  // ── Logs ──
  getLogs: (filters?: SmsLogFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.phone) params.set("phone", filters.phone);
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));
    const qs = params.toString();
    return request<{ logs: SmsLog[]; total: number }>(`/sms/logs${qs ? `?${qs}` : ""}`);
  },

  getLog: (id: string) => request<SmsLog>(`/sms/logs/${id}`),

  getLogStats: () =>
    request<{ total: number; sent: number; failed: number; pending: number }>("/sms/logs/stats"),
};
