// Notification API layer
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type NotificationType =
  | "booking_created"
  | "payment_received"
  | "subscription_expiring"
  | "invoice_created"
  | "task_assigned"
  | "system";

export interface Notification {
  id: string;
  tenantId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// Demo notifications for local/preview
const demoNotifications: Notification[] = [
  {
    id: "1",
    tenantId: "demo",
    type: "booking_created",
    title: "New Booking",
    message: "Cox's Bazar Beach Getaway booked by Rahim Ahmed",
    read: false,
    link: "/bookings",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    tenantId: "demo",
    type: "payment_received",
    title: "Payment Received",
    message: "৳45,000 received for Bangkok & Pattaya Explorer",
    read: false,
    link: "/invoices",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "3",
    tenantId: "demo",
    type: "subscription_expiring",
    title: "Subscription Expiring",
    message: "Your Pro plan expires in 3 days. Renew now!",
    read: false,
    link: "/subscription",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "4",
    tenantId: "demo",
    type: "booking_created",
    title: "New Booking",
    message: "Dubai Luxury Package booked by Karim Hasan",
    read: true,
    link: "/bookings",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "5",
    tenantId: "demo",
    type: "payment_received",
    title: "Payment Received",
    message: "৳15,000 received for Visa Processing",
    read: true,
    link: "/invoices",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

let localNotifications = [...demoNotifications];

const isDemo = () => {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname.includes("lovable.app");
};

export const notificationApi = {
  list: async (): Promise<Notification[]> => {
    if (isDemo()) return localNotifications;
    const res = await fetch(`${BASE_URL}/notifications`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },

  unreadCount: async (): Promise<number> => {
    if (isDemo()) return localNotifications.filter((n) => !n.read).length;
    const res = await fetch(`${BASE_URL}/notifications/unread-count`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    if (isDemo()) {
      localNotifications = localNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return;
    }
    await fetch(`${BASE_URL}/notifications/${id}/read`, { method: "PATCH", headers: authHeaders() });
  },

  markAllRead: async (): Promise<void> => {
    if (isDemo()) {
      localNotifications = localNotifications.map((n) => ({ ...n, read: true }));
      return;
    }
    await fetch(`${BASE_URL}/notifications/read-all`, { method: "PATCH", headers: authHeaders() });
  },

  delete: async (id: string): Promise<void> => {
    if (isDemo()) {
      localNotifications = localNotifications.filter((n) => n.id !== id);
      return;
    }
    await fetch(`${BASE_URL}/notifications/${id}`, { method: "DELETE", headers: authHeaders() });
  },
};
