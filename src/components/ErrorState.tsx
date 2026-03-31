import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({ message = "Something went wrong. Please try again.", onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="rounded-full bg-destructive/10 p-4 mb-4">
      <AlertTriangle className="h-8 w-8 text-destructive" />
    </div>
    <h3 className="text-lg font-semibold mb-1">Error</h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
      </Button>
    )}
  </div>
);

export default ErrorState;
