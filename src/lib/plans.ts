// ── Subscription Plans Configuration ──

export type PlanType = "free" | "basic" | "pro" | "business" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "active" | "overdue" | "expired" | "suspended" | "cancelled";

export interface PlanConfig {
  id: PlanType;
  name: string;
  monthlyPrice: number; // BDT/month, 0 = free, -1 = custom
  yearlyPrice: number;  // BDT/year, 0 = free, -1 = custom
  description: string;
  badge?: string;
  trialDays: number; // 0 = no trial

  // ── Limits (−1 = unlimited) ──
  maxClients: number;
  maxBookings: number;
  maxUsers: number;
  maxDomains: number;
  maxBranches: number;
  maxSmsPerMonth: number;
  maxStorageMB: number;
  maxReports: number;
  maxLeads: number;
  maxQuotations: number;

  // ── Feature flags ──
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
  hasHajjUmrah: boolean;
  hasPrioritySupport: boolean;
}

// ── Helper: yearly price with discount ──
const yearly = (monthly: number, discountPct = 20) =>
  monthly <= 0 ? monthly : Math.round(monthly * 12 * (1 - discountPct / 100));

export const PLANS: PlanConfig[] = [
  {
    id: "free", name: "Free", monthlyPrice: 0, yearlyPrice: 0,
    description: "Get started with basic features", trialDays: 0,
    maxClients: 50, maxBookings: 50, maxUsers: 1, maxDomains: 0,
    maxBranches: 1, maxSmsPerMonth: 0, maxStorageMB: 100, maxReports: 5,
    maxLeads: 50, maxQuotations: 20,
    features: ["Dashboard", "CRM (50 clients)", "Bookings (50/month)", "Invoice system", "Subdomain website"],
    restrictions: ["No online payment", "Only manual payment", "No custom domain"],
    paymentGateways: ["manual"],
    hasCustomDomain: false, hasWebsiteTemplates: false, hasSmsIntegration: false,
    hasWhatsApp: false, hasEmailNotifications: false, hasAgentCommission: false,
    hasAdvancedAnalytics: false, hasMarketingTools: false, hasApiAccess: false,
    hasRefundSystem: false, hasHajjUmrah: false, hasPrioritySupport: false,
  },
  {
    id: "basic", name: "Basic", monthlyPrice: 800, yearlyPrice: yearly(800),
    description: "For growing travel agencies", badge: "Most Popular", trialDays: 14,
    maxClients: -1, maxBookings: -1, maxUsers: 5, maxDomains: 0,
    maxBranches: 1, maxSmsPerMonth: 100, maxStorageMB: 500, maxReports: 20,
    maxLeads: -1, maxQuotations: -1,
    features: ["Unlimited clients", "Unlimited bookings", "Accounting", "Invoice + payments", "Email notifications", "5 team members"],
    restrictions: ["No payment gateway", "No SMS/WhatsApp", "No custom domain"],
    paymentGateways: ["manual"],
    hasCustomDomain: false, hasWebsiteTemplates: false, hasSmsIntegration: false,
    hasWhatsApp: false, hasEmailNotifications: true, hasAgentCommission: false,
    hasAdvancedAnalytics: false, hasMarketingTools: false, hasApiAccess: false,
    hasRefundSystem: false, hasHajjUmrah: false, hasPrioritySupport: false,
  },
  {
    id: "pro", name: "Pro", monthlyPrice: 1500, yearlyPrice: yearly(1500),
    description: "Professional agency management", badge: "Best Value", trialDays: 14,
    maxClients: -1, maxBookings: -1, maxUsers: 20, maxDomains: 1,
    maxBranches: 3, maxSmsPerMonth: 500, maxStorageMB: 2048, maxReports: -1,
    maxLeads: -1, maxQuotations: -1,
    features: ["Everything in Basic", "Custom domain", "Website templates", "SMS integration", "Agent commission", "SSLCommerz gateway", "20 team members"],
    restrictions: ["No WhatsApp", "No marketing tools"],
    paymentGateways: ["manual", "sslcommerz"],
    hasCustomDomain: true, hasWebsiteTemplates: true, hasSmsIntegration: true,
    hasWhatsApp: false, hasEmailNotifications: true, hasAgentCommission: true,
    hasAdvancedAnalytics: false, hasMarketingTools: false, hasApiAccess: false,
    hasRefundSystem: false, hasHajjUmrah: true, hasPrioritySupport: false,
  },
  {
    id: "business", name: "Business", monthlyPrice: 3000, yearlyPrice: yearly(3000),
    description: "For large agencies & enterprises", trialDays: 14,
    maxClients: -1, maxBookings: -1, maxUsers: -1, maxDomains: -1,
    maxBranches: -1, maxSmsPerMonth: 2000, maxStorageMB: 10240, maxReports: -1,
    maxLeads: -1, maxQuotations: -1,
    features: ["Everything in Pro", "WhatsApp", "Marketing tools", "Advanced analytics", "bKash gateway", "Refund system", "Unlimited team"],
    restrictions: [],
    paymentGateways: ["manual", "sslcommerz", "bkash"],
    hasCustomDomain: true, hasWebsiteTemplates: true, hasSmsIntegration: true,
    hasWhatsApp: true, hasEmailNotifications: true, hasAgentCommission: true,
    hasAdvancedAnalytics: true, hasMarketingTools: true, hasApiAccess: false,
    hasRefundSystem: true, hasHajjUmrah: true, hasPrioritySupport: true,
  },
  {
    id: "enterprise", name: "Enterprise", monthlyPrice: -1, yearlyPrice: -1,
    description: "Custom solution for large organizations", trialDays: 30,
    maxClients: -1, maxBookings: -1, maxUsers: -1, maxDomains: -1,
    maxBranches: -1, maxSmsPerMonth: -1, maxStorageMB: -1, maxReports: -1,
    maxLeads: -1, maxQuotations: -1,
    features: ["All features unlocked", "Custom design", "Custom integrations", "All gateways", "API access", "Dedicated manager", "Priority 24/7 support"],
    restrictions: [],
    paymentGateways: ["manual", "sslcommerz", "bkash", "custom"],
    hasCustomDomain: true, hasWebsiteTemplates: true, hasSmsIntegration: true,
    hasWhatsApp: true, hasEmailNotifications: true, hasAgentCommission: true,
    hasAdvancedAnalytics: true, hasMarketingTools: true, hasApiAccess: true,
    hasRefundSystem: true, hasHajjUmrah: true, hasPrioritySupport: true,
  },
];

export function getPlan(planId: PlanType): PlanConfig {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

export function getPlanPrice(planId: PlanType, cycle: BillingCycle): number {
  const plan = getPlan(planId);
  return cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function getYearlySavings(planId: PlanType): number {
  const plan = getPlan(planId);
  if (plan.monthlyPrice <= 0) return 0;
  return (plan.monthlyPrice * 12) - plan.yearlyPrice;
}

export function getLimitLabel(value: number): string {
  if (value === -1) return "Unlimited";
  if (value === 0) return "None";
  return value.toLocaleString();
}

export function getDomainLimitLabel(planId: PlanType): string {
  const plan = getPlan(planId);
  return getLimitLabel(plan.maxDomains);
}

// ── Subscription interface ──
export interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  plan: PlanType;
  billingCycle: BillingCycle;
  price: number;
  startDate: string;
  endDate: string;
  trialStartDate?: string;
  trialEndDate?: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  paymentMethod?: string;
  cancelReason?: string;
  cancelledAt?: string;
  suspendedAt?: string;
  suspendReason?: string;
  // Usage counters
  usedClients?: number;
  usedBookings?: number;
  usedUsers?: number;
  usedSms?: number;
  usedStorageMB?: number;
  usedBranches?: number;
  usedLeads?: number;
  usedQuotations?: number;
}

// ── Usage helper ──
export interface UsageCheck {
  resource: string;
  used: number;
  limit: number;
  isUnlimited: boolean;
  percentage: number;
  isNearLimit: boolean; // >80%
  isAtLimit: boolean;
}

export function checkUsage(sub: TenantSubscription): UsageCheck[] {
  const plan = getPlan(sub.plan);
  const checks: [string, number, number][] = [
    ["Clients", sub.usedClients || 0, plan.maxClients],
    ["Bookings", sub.usedBookings || 0, plan.maxBookings],
    ["Users", sub.usedUsers || 0, plan.maxUsers],
    ["SMS", sub.usedSms || 0, plan.maxSmsPerMonth],
    ["Storage (MB)", sub.usedStorageMB || 0, plan.maxStorageMB],
    ["Branches", sub.usedBranches || 0, plan.maxBranches],
    ["Leads", sub.usedLeads || 0, plan.maxLeads],
    ["Quotations", sub.usedQuotations || 0, plan.maxQuotations],
  ];
  return checks.map(([resource, used, limit]) => {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited || limit === 0 ? 0 : Math.round((used / limit) * 100);
    return {
      resource, used, limit, isUnlimited,
      percentage: Math.min(percentage, 100),
      isNearLimit: !isUnlimited && limit > 0 && percentage >= 80,
      isAtLimit: !isUnlimited && limit > 0 && used >= limit,
    };
  });
}

// Feature comparison table
export const FEATURE_COMPARISON = [
  { category: "Core", features: [
    { name: "Dashboard", free: true, basic: true, pro: true, business: true, enterprise: true },
    { name: "CRM System", free: "50 clients", basic: "Unlimited", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
    { name: "Bookings", free: "50/month", basic: "Unlimited", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
    { name: "Team Members", free: "1", basic: "5", pro: "20", business: "Unlimited", enterprise: "Unlimited" },
    { name: "Branches", free: "1", basic: "1", pro: "3", business: "Unlimited", enterprise: "Unlimited" },
  ]},
  { category: "Billing & Payments", features: [
    { name: "Invoice System", free: true, basic: true, pro: true, business: true, enterprise: true },
    { name: "Manual Payment", free: true, basic: true, pro: true, business: true, enterprise: true },
    { name: "SSLCommerz Gateway", free: false, basic: false, pro: true, business: true, enterprise: true },
    { name: "bKash Gateway", free: false, basic: false, pro: false, business: true, enterprise: true },
    { name: "Refund System", free: false, basic: false, pro: false, business: true, enterprise: true },
  ]},
  { category: "Communication", features: [
    { name: "Email Notifications", free: false, basic: true, pro: true, business: true, enterprise: true },
    { name: "SMS Integration", free: "None", basic: "100/mo", pro: "500/mo", business: "2,000/mo", enterprise: "Unlimited" },
    { name: "WhatsApp", free: false, basic: false, pro: false, business: true, enterprise: true },
  ]},
  { category: "Website & Storage", features: [
    { name: "Custom Domain", free: false, basic: false, pro: "1", business: "Unlimited", enterprise: "Unlimited" },
    { name: "Storage", free: "100 MB", basic: "500 MB", pro: "2 GB", business: "10 GB", enterprise: "Unlimited" },
    { name: "Website Templates", free: false, basic: false, pro: true, business: true, enterprise: true },
  ]},
  { category: "Advanced", features: [
    { name: "Hajj & Umrah", free: false, basic: false, pro: true, business: true, enterprise: true },
    { name: "Advanced Analytics", free: false, basic: false, pro: false, business: true, enterprise: true },
    { name: "API Access", free: false, basic: false, pro: false, business: false, enterprise: true },
    { name: "Priority Support", free: false, basic: false, pro: false, business: true, enterprise: true },
  ]},
];
