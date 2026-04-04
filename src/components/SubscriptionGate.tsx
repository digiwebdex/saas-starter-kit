import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

/**
 * Blocks access to dashboard content when subscription is expired.
 * Free plan users are never blocked (free never expires).
 */
const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { isSubscriptionExpired, isTrialActive, trialDaysLeft, tenant, currentPlan } = useAuth();
  const navigate = useNavigate();

  // Trial expired → show upgrade prompt (not block)
  const trialExpired = tenant?.subscriptionStatus === "trial" && tenant?.subscriptionExpiry && new Date(tenant.subscriptionExpiry) < new Date();

  if (!isSubscriptionExpired && !trialExpired) {
    return <>{children}</>;
  }

  const expiryDate = tenant?.subscriptionExpiry
    ? new Date(tenant.subscriptionExpiry).toLocaleDateString()
    : "N/A";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {trialExpired ? "Trial Period Ended" : "Subscription Expired"}
          </h2>
          <p className="text-muted-foreground mb-2">
            {trialExpired ? (
              <>Your <strong>14-day Pro trial</strong> has ended. Subscribe to a plan to continue using all features.</>
            ) : (
              <>Your <strong className="capitalize">{currentPlan}</strong> plan expired on{" "}
              <strong>{expiryDate}</strong>.</>
            )}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Please renew your subscription to continue using the platform. Your data is safe and will be available once you reactivate.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/subscription")} className="gap-2">
              <Crown className="h-4 w-4" /> Renew / Upgrade
            </Button>
            <Button variant="outline" onClick={() => navigate("/site")}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGate;
