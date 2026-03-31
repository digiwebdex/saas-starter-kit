// ── Subscription Plans Configuration ──

export type PlanType = "free" | "basic" | "pro" | "business" | "enterprise";

export interface PlanConfig {
  id: PlanType;
  name: string;
  price: number; // BDT/month, 0 = free, -1 = custom
  description: string;
  badge?: string; // "Most Popular", "Best Value", etc.
  maxClients: number; // -1 = unlimited
  maxBookings: number; // -1 = unlimited
  maxUsers: number; // -1 = unlimited
  maxDomains: number; // 0 = no domain, -1 = unlimited
  features: string[];
  restrictions: string[];
  paymentGateways: ("manual" | "sslcommerz" | "bkash" | "custom")[];
  hasCustomDomain: boolean;
  hasWebsiteTemplates: boolean;
  hasSmsIntegration: boolean;
  hasWhatsApp: boolean;
  hasEmailNotifications: boolean;
  hasAgentCommission: boolean;
  hasAdvancedAnalytics: boolean;
  hasMarketingTools: boolean;
  hasApiAccess: boolean;
  hasRefundSystem: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Get started with basic features",
    maxClients: 50,
    maxBookings: 50,
    maxUsers: 1,
    features: [
      "Dashboard",
      "CRM (50 clients limit)",
      "Bookings (50/month)",
      "Invoice system",
      "Website with subdomain",
    ],
    restrictions: [
      "No online payment gateway",
      "Only manual payment (cash/bank)",
      "No custom domain",
    ],
    paymentGateways: ["manual"],
    hasCustomDomain: false,
    hasWebsiteTemplates: false,
    hasSmsIntegration: false,
    hasWhatsApp: false,
    hasEmailNotifications: false,
    hasAgentCommission: false,
    hasAdvancedAnalytics: false,
    hasMarketingTools: false,
    hasApiAccess: false,
    hasRefundSystem: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: 800,
    description: "For growing travel agencies",
    badge: "Most Popular",
    maxClients: -1,
    maxBookings: -1,
    maxUsers: 5,
    features: [
      "Unlimited clients",
      "Unlimited bookings",
      "Accounting system",
      "Invoice + payment tracking",
      "Email notifications",
      "Up to 5 team members",
    ],
    restrictions: [
      "No payment gateway",
      "No SMS/WhatsApp",
      "No custom domain",
    ],
    paymentGateways: ["manual"],
    hasCustomDomain: false,
    hasWebsiteTemplates: false,
    hasSmsIntegration: false,
    hasWhatsApp: false,
    hasEmailNotifications: true,
    hasAgentCommission: false,
    hasAdvancedAnalytics: false,
    hasMarketingTools: false,
    hasApiAccess: false,
    hasRefundSystem: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 1500,
    description: "Professional agency management",
    badge: "Best Value",
    maxClients: -1,
    maxBookings: -1,
    maxUsers: 20,
    features: [
      "Everything in Basic",
      "Custom domain support",
      "Website templates",
      "SMS integration",
      "Agent commission system",
      "SSLCommerz payment gateway",
      "\"Pay Now\" button on invoices",
      "Up to 20 team members",
    ],
    restrictions: [
      "No WhatsApp integration",
      "No marketing tools",
    ],
    paymentGateways: ["manual", "sslcommerz"],
    hasCustomDomain: true,
    hasWebsiteTemplates: true,
    hasSmsIntegration: true,
    hasWhatsApp: false,
    hasEmailNotifications: true,
    hasAgentCommission: true,
    hasAdvancedAnalytics: false,
    hasMarketingTools: false,
    hasApiAccess: false,
    hasRefundSystem: false,
  },
  {
    id: "business",
    name: "Business",
    price: 3000,
    description: "For large agencies & enterprises",
    maxClients: -1,
    maxBookings: -1,
    maxUsers: -1,
    features: [
      "Everything in Pro",
      "WhatsApp integration",
      "Marketing tools (SMS/email campaigns)",
      "Advanced analytics dashboard",
      "SSLCommerz + bKash gateways",
      "Payment reports",
      "Refund system (full + partial)",
      "Unlimited team members",
    ],
    restrictions: [],
    paymentGateways: ["manual", "sslcommerz", "bkash"],
    hasCustomDomain: true,
    hasWebsiteTemplates: true,
    hasSmsIntegration: true,
    hasWhatsApp: true,
    hasEmailNotifications: true,
    hasAgentCommission: true,
    hasAdvancedAnalytics: true,
    hasMarketingTools: true,
    hasApiAccess: false,
    hasRefundSystem: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: -1, // Custom pricing
    description: "Custom solution for large organizations",
    maxClients: -1,
    maxBookings: -1,
    maxUsers: -1,
    features: [
      "All features unlocked",
      "Custom website design",
      "Custom integrations",
      "Multi-payment gateway support",
      "SSLCommerz + bKash + Custom gateways",
      "Dedicated account manager",
      "API access",
      "Priority 24/7 support",
    ],
    restrictions: [],
    paymentGateways: ["manual", "sslcommerz", "bkash", "custom"],
    hasCustomDomain: true,
    hasWebsiteTemplates: true,
    hasSmsIntegration: true,
    hasWhatsApp: true,
    hasEmailNotifications: true,
    hasAgentCommission: true,
    hasAdvancedAnalytics: true,
    hasMarketingTools: true,
    hasApiAccess: true,
    hasRefundSystem: true,
  },
];

export function getPlan(planId: PlanType): PlanConfig {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

// Feature comparison table structure
export const FEATURE_COMPARISON = [
  { category: "Core", features: [
    { name: "Dashboard", free: true, basic: true, pro: true, business: true, enterprise: true },
    { name: "CRM System", free: "50 clients", basic: "Unlimited", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
    { name: "Bookings", free: "50/month", basic: "Unlimited", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
    { name: "Team Members", free: "1", basic: "5", pro: "20", business: "Unlimited", enterprise: "Unlimited" },
  ]},
  { category: "Billing & Payments", features: [
    { name: "Invoice System", free: true, basic: true, pro: true, business: true, enterprise: true },
    { name: "Manual Payment (Cash/Bank)", free: true, basic: true, pro: true, business: true, enterprise: true },
    { name: "SSLCommerz Gateway", free: false, basic: false, pro: true, business: true, enterprise: true },
    { name: "bKash Gateway", free: false, basic: false, pro: false, business: true, enterprise: true },
    { name: "Custom Gateway", free: false, basic: false, pro: false, business: false, enterprise: true },
    { name: "Refund System", free: false, basic: false, pro: false, business: true, enterprise: true },
    { name: "Payment Reports", free: false, basic: false, pro: false, business: true, enterprise: true },
  ]},
  { category: "Communication", features: [
    { name: "Email Notifications", free: false, basic: true, pro: true, business: true, enterprise: true },
    { name: "SMS Integration", free: false, basic: false, pro: true, business: true, enterprise: true },
    { name: "WhatsApp Integration", free: false, basic: false, pro: false, business: true, enterprise: true },
    { name: "Marketing Campaigns", free: false, basic: false, pro: false, business: true, enterprise: true },
  ]},
  { category: "Website & Domain", features: [
    { name: "Subdomain Website", free: true, basic: true, pro: true, business: true, enterprise: true },
    { name: "Custom Domain", free: false, basic: false, pro: true, business: true, enterprise: true },
    { name: "Website Templates", free: false, basic: false, pro: true, business: true, enterprise: true },
    { name: "Custom Website Design", free: false, basic: false, pro: false, business: false, enterprise: true },
  ]},
  { category: "Advanced", features: [
    { name: "Accounting System", free: false, basic: true, pro: true, business: true, enterprise: true },
    { name: "Agent Commission", free: false, basic: false, pro: true, business: true, enterprise: true },
    { name: "Advanced Analytics", free: false, basic: false, pro: false, business: true, enterprise: true },
    { name: "API Access", free: false, basic: false, pro: false, business: false, enterprise: true },
  ]},
];
