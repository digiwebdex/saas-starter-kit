import { useMemo } from "react";
import { getPlan, type PlanType, type PlanConfig, type BillingCycle, getPlanPrice, checkUsage, type TenantSubscription, type UsageCheck } from "@/lib/plans";

/**
 * Hook to check feature access based on the current tenant's plan.
 */
export function usePlanAccess(currentPlan: PlanType = "free") {
  const plan: PlanConfig = useMemo(() => getPlan(currentPlan), [currentPlan]);

  return {
    plan,
    planId: plan.id,
    planName: plan.name,

    // Prices
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    trialDays: plan.trialDays,

    // Limits
    maxClients: plan.maxClients,
    maxBookings: plan.maxBookings,
    maxUsers: plan.maxUsers,
    maxDomains: plan.maxDomains,
    maxBranches: plan.maxBranches,
    maxSmsPerMonth: plan.maxSmsPerMonth,
    maxStorageMB: plan.maxStorageMB,
    maxReports: plan.maxReports,
    isUnlimitedClients: plan.maxClients === -1,
    isUnlimitedBookings: plan.maxBookings === -1,

    // Feature flags
    canUsePaymentGateway: plan.paymentGateways.length > 1,
    canUseSslCommerz: plan.paymentGateways.includes("sslcommerz"),
    canUseBkash: plan.paymentGateways.includes("bkash"),
    canUseCustomGateway: plan.paymentGateways.includes("custom"),
    canUseCustomDomain: plan.hasCustomDomain,
    canUseWebsiteTemplates: plan.hasWebsiteTemplates,
    canUseSms: plan.hasSmsIntegration,
    canUseWhatsApp: plan.hasWhatsApp,
    canUseEmail: plan.hasEmailNotifications,
    canUseAgentCommission: plan.hasAgentCommission,
    canUseAdvancedAnalytics: plan.hasAdvancedAnalytics,
    canUseMarketingTools: plan.hasMarketingTools,
    canUseApi: plan.hasApiAccess,
    canUseRefund: plan.hasRefundSystem,
    canUseHajjUmrah: plan.hasHajjUmrah,
    hasPrioritySupport: plan.hasPrioritySupport,

    // Helpers
    hasFeature: (feature: keyof PlanConfig) => !!plan[feature],
    requiresUpgrade: (feature: keyof PlanConfig) => !plan[feature],
    getUpgradePlan: (feature: keyof PlanConfig): PlanType | null => {
      const order: PlanType[] = ["free", "basic", "pro", "business", "enterprise"];
      const currentIdx = order.indexOf(currentPlan);
      for (let i = currentIdx + 1; i < order.length; i++) {
        const p = getPlan(order[i]);
        if (p[feature]) return order[i];
      }
      return null;
    },
  };
}
