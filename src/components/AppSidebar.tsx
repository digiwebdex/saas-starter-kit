import { LayoutDashboard, Users, Settings, Building2, LogOut, UserCheck, UserCog, Store, Target, ListTodo, Plane, Receipt, Wallet, Crown, Shield, BarChart3, Moon, Globe } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
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
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

const crmItems = [
  { title: "Clients", url: "/clients", icon: UserCheck },
  { title: "Agents", url: "/agents", icon: UserCog },
  { title: "Vendors", url: "/vendors", icon: Store },
  { title: "Leads", url: "/leads", icon: Target },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Bookings", url: "/bookings", icon: Plane },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Hajj/Umrah", url: "/hajj-umrah", icon: Moon },
];

const managementItems = [
  { title: "Team", url: "/team", icon: Users },
  { title: "Organization", url: "/organization", icon: Building2 },
  { title: "Subscription", url: "/subscription", icon: Crown },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavGroup({ label, items, collapsed }: { label: string; items: typeof mainItems; collapsed: boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{!collapsed ? label : ""}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-3 py-3">
          {!collapsed && <span className="text-sm font-bold tracking-tight">SaaS App</span>}
        </div>
        <NavGroup label="Overview" items={mainItems} collapsed={collapsed} />
        <NavGroup label="CRM" items={crmItems} collapsed={collapsed} />
        <NavGroup label="Management" items={managementItems} collapsed={collapsed} />
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
