import { LayoutDashboard, Users, Settings, Building2, LogOut, UserCheck, UserCog, Store, Target, ListTodo, Plane, Receipt, Wallet, Crown, Shield, BarChart3, Moon, Globe, Lock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { PlanType } from "@/lib/plans";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  requiredFeature?: string; // maps to PlanConfig key
  minPlan?: PlanType;
}

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

const crmItems: MenuItem[] = [
  { title: "Clients", url: "/clients", icon: UserCheck },
  { title: "Agents", url: "/agents", icon: UserCog },
  { title: "Vendors", url: "/vendors", icon: Store },
  { title: "Leads", url: "/leads", icon: Target },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Bookings", url: "/bookings", icon: Plane },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Accounts", url: "/accounts", icon: Wallet, requiredFeature: "hasEmailNotifications", minPlan: "basic" },
  { title: "Reports", url: "/reports", icon: BarChart3, requiredFeature: "hasAdvancedAnalytics", minPlan: "business" },
  { title: "Hajj/Umrah", url: "/hajj-umrah", icon: Moon },
];

const managementItems: MenuItem[] = [
  { title: "Team", url: "/team", icon: Users },
  { title: "Organization", url: "/organization", icon: Building2 },
  { title: "Website", url: "/website", icon: Globe, requiredFeature: "hasWebsiteTemplates", minPlan: "pro" },
  { title: "Subscription", url: "/subscription", icon: Crown },
  { title: "Settings", url: "/settings", icon: Settings },
];

const planOrder: PlanType[] = ["free", "basic", "pro", "business", "enterprise"];

function isFeatureAvailable(requiredFeature: string | undefined, minPlan: PlanType | undefined, currentPlan: PlanType): boolean {
  if (!requiredFeature && !minPlan) return true;
  if (minPlan) {
    const currentIdx = planOrder.indexOf(currentPlan);
    const requiredIdx = planOrder.indexOf(minPlan);
    return currentIdx >= requiredIdx;
  }
  return true;
}

function getMinPlanName(minPlan?: PlanType): string {
  if (!minPlan) return "a higher";
  return minPlan.charAt(0).toUpperCase() + minPlan.slice(1);
}

function NavGroup({ label, items, collapsed, currentPlan }: { label: string; items: MenuItem[]; collapsed: boolean; currentPlan: PlanType }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{!collapsed ? label : ""}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const available = isFeatureAvailable(item.requiredFeature, item.minPlan, currentPlan);

            if (!available) {
              return (
                <SidebarMenuItem key={item.title}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground/50 cursor-not-allowed select-none">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              <Lock className="h-3 w-3" />
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Upgrade to {getMinPlanName(item.minPlan)} plan to unlock</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout, currentPlan } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-3 py-3">
          {!collapsed && <span className="text-sm font-bold tracking-tight">SaaS App</span>}
        </div>
        <NavGroup label="Overview" items={mainItems} collapsed={collapsed} currentPlan={currentPlan} />
        <NavGroup label="CRM" items={crmItems} collapsed={collapsed} currentPlan={currentPlan} />
        <NavGroup label="Management" items={managementItems} collapsed={collapsed} currentPlan={currentPlan} />
        {user?.role === "owner" && (
          <SidebarGroup>
            <SidebarGroupLabel>{!collapsed ? "Admin" : ""}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className="hover:bg-sidebar-accent/50 text-destructive" activeClassName="bg-sidebar-accent font-medium">
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && user && (
          <div className="px-3 pb-1">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-primary capitalize">{currentPlan} Plan</p>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Logout"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
