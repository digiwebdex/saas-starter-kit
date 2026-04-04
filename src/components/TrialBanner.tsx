import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Crown, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Shows a banner when the user is on a trial plan.
 * Displays days remaining and upgrade CTA.
 */
const TrialBanner = () => {
  const { isTrialActive, trialDaysLeft } = useAuth();
  const navigate = useNavigate();

  if (!isTrialActive || trialDaysLeft <= 0) return null;

  const urgent = trialDaysLeft <= 3;

  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm ${
      urgent
        ? "border-destructive/30 bg-destructive/5 text-destructive"
        : "border-primary/20 bg-primary/5 text-primary"
    }`}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          <strong>Pro Trial</strong> — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining.
          {urgent ? " Upgrade now to keep all features!" : " Enjoy all Pro features during your trial."}
        </span>
      </div>
      <Button
        size="sm"
        variant={urgent ? "destructive" : "default"}
        className="shrink-0"
        onClick={() => navigate("/subscription")}
      >
        <Crown className="mr-1.5 h-3.5 w-3.5" />
        Upgrade Now
      </Button>
    </div>
  );
};

export default TrialBanner;
