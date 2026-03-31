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

export const smsApi = {
  getConfig: () => request<SmsConfig>("/sms/config"),
  updateConfig: (config: SmsConfig) =>
    request<SmsConfig>("/sms/config", { method: "PUT", body: JSON.stringify(config) }),
  testSms: (phone: string) =>
    request<{ success: boolean; message: string }>("/sms/test", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  send: (phone: string, message: string) =>
    request<{ success: boolean }>("/sms/send", {
      method: "POST",
      body: JSON.stringify({ phone, message }),
    }),
};
