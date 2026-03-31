import { LayoutDashboard, Users, Settings, Building2, LogOut, UserCheck, UserCog, Store, Target, ListTodo, Plane, Receipt } from "lucide-react";
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
];

const managementItems = [
  { title: "Team", url: "/team", icon: Users },
  { title: "Organization", url: "/organization", icon: Building2 },
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
