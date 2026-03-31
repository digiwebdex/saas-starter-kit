import React from "react";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { isFeatureEnabled } from "@/lib/features";
import type { PlanType } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  featureId: string;
  currentPlan?: PlanType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps content that requires a specific feature.
 * If the feature is disabled for the current plan, shows an upgrade prompt.
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  currentPlan = "free",
  children,
  fallback,
}) => {
  const navigate = useNavigate();
  const access = usePlanAccess(currentPlan);
  const enabled = isFeatureEnabled(featureId, currentPlan);

  if (enabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default blocked UI
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Feature Locked</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          This feature is not available on your current <strong className="capitalize">{access.planName}</strong> plan.
          Upgrade to unlock this and more features.
        </p>
        <Button onClick={() => navigate("/subscription")}>
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeatureGate;
