// Email API — calls backend SMTP email endpoints
import type { Booking, Invoice } from "./api";

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

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export const emailApi = {
  // SMTP config
  getSmtpConfig: () => request<SmtpConfig>("/email/config"),
  updateSmtpConfig: (config: SmtpConfig) =>
    request<SmtpConfig>("/email/config", { method: "PUT", body: JSON.stringify(config) }),
  testSmtp: (to: string) =>
    request<{ success: boolean; message: string }>("/email/test", { method: "POST", body: JSON.stringify({ to }) }),

  // Send emails
  sendBookingConfirmation: (bookingId: string) =>
    request<{ success: boolean }>("/email/send/booking-confirmation", {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    }),
  sendInvoice: (invoiceId: string) =>
    request<{ success: boolean }>("/email/send/invoice", {
      method: "POST",
      body: JSON.stringify({ invoiceId }),
    }),
};
