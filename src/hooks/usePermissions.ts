import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  canAccessModule,
  getModulePermissions,
  getAccessibleModules,
  mapLegacyRole,
  type AppRole,
  type Module,
  type Action,
  type PermissionMatrix,
} from "@/lib/permissions";

/**
 * Hook providing permission checks for the current user.
 * Reads role from AuthContext and maps legacy roles automatically.
 */
export function usePermissions() {
  const { user } = useAuth();

  const role: AppRole = useMemo(() => {
    if (!user) return "sales_agent"; // safest default
    return mapLegacyRole(user.role);
  }, [user?.role]);

  return useMemo(() => ({
    role,

    /** Check a single permission */
    can: (module: Module, action: Action): boolean =>
      hasPermission(role, module, action),

    /** Check if user can access a module at all */
    canAccess: (module: Module): boolean =>
      canAccessModule(role, module),

    /** Get all permissions for a module */
    modulePerms: (module: Module): Partial<Record<Action, boolean>> =>
      getModulePermissions(role, module),

    /** Get all modules the user can access */
    accessibleModules: getAccessibleModules(role),

    /** Role checks */
    isSuperAdmin: role === "super_admin",
    isTenantOwner: role === "tenant_owner",
    isManager: role === "manager",
    isSalesAgent: role === "sales_agent",
    isAccountant: role === "accountant",
    isOperations: role === "operations",

    /** Can manage team (owner or super admin) */
    canManageTeam: role === "super_admin" || role === "tenant_owner",

    /** Can manage subscription */
    canManageSubscription: role === "super_admin" || role === "tenant_owner",

    /** Can access admin panel */
    canAccessAdmin: role === "super_admin",
  }), [role]);
}
