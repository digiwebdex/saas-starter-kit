import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AdminNotificationBell from "@/components/AdminNotificationBell";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "A";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <AdminNotificationBell />
              <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-destructive text-destructive-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
