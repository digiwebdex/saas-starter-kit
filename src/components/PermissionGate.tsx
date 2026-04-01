import { usePermissions } from "@/hooks/usePermissions";
import type { Module, Action } from "@/lib/permissions";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface PermissionGateProps {
  /** Module to check */
  module: Module;
  /** Action to check. If omitted, checks if user can access the module at all. */
  action?: Action;
  /** Content to render when permission is granted */
  children: React.ReactNode;
  /** What to render when denied. Defaults to nothing. */
  fallback?: React.ReactNode;
  /** If true, shows a disabled/locked version instead of hiding */
  showLocked?: boolean;
  /** Tooltip text for locked state */
  lockedMessage?: string;
}

/**
 * Conditionally renders children based on user permissions.
 *
 * Usage:
 * <PermissionGate module="bookings" action="create">
 *   <Button>New Booking</Button>
 * </PermissionGate>
 *
 * <PermissionGate module="reports" action="export" showLocked lockedMessage="Upgrade to export">
 *   <Button>Export PDF</Button>
 * </PermissionGate>
 */
const PermissionGate = ({
  module,
  action,
  children,
  fallback = null,
  showLocked = false,
  lockedMessage = "You don't have permission for this action",
}: PermissionGateProps) => {
  const { can, canAccess } = usePermissions();

  const allowed = action ? can(module, action) : canAccess(module);

  if (allowed) return <>{children}</>;

  if (showLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 opacity-40 cursor-not-allowed select-none">
              {children}
              <Lock className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{lockedMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
};

export default PermissionGate;
