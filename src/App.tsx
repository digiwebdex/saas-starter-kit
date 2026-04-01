import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useInRouterContext } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebsiteProvider } from "@/contexts/WebsiteContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Organization from "./pages/Organization";
import SettingsPage from "./pages/SettingsPage";
import WebsiteCustomizer from "./pages/WebsiteCustomizer";
import Clients from "./pages/Clients";
import Agents from "./pages/Agents";
import Vendors from "./pages/Vendors";
import Leads from "./pages/Leads";
import Tasks from "./pages/Tasks";
import Bookings from "./pages/Bookings";
import Invoices from "./pages/Invoices";
import Accounts from "./pages/Accounts";
import Reports from "./pages/Reports";
import HajjUmrah from "./pages/HajjUmrah";
import Subscriptions from "./pages/Subscriptions";
import PaymentCallback from "./pages/PaymentCallback";
import RoleManagement from "./pages/RoleManagement";
import Onboarding from "./pages/Onboarding";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminTenantDetails from "./pages/admin/AdminTenantDetails";
import AdminDomains from "./pages/admin/AdminDomains";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminSmsTemplates from "./pages/admin/AdminSmsTemplates";
import AdminSmsLogs from "./pages/admin/AdminSmsLogs";
import AdminRoles from "./pages/admin/AdminRoles";
import SiteHome from "./pages/site/SiteHome";
import SiteAbout from "./pages/site/SiteAbout";
import SitePackages from "./pages/site/SitePackages";
import SiteContact from "./pages/site/SiteContact";
import SitePricing from "./pages/site/SitePricing";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const A = ({ children }: { children: React.ReactNode }) => (
  <AdminRoute>{children}</AdminRoute>
);

const AppContent = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Main landing page */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<P><Onboarding /></P>} />

              {/* Public website (no auth required) */}
              <Route path="/site" element={<WebsiteProvider><SiteHome /></WebsiteProvider>} />
              <Route path="/site/about" element={<WebsiteProvider><SiteAbout /></WebsiteProvider>} />
              <Route path="/site/packages" element={<WebsiteProvider><SitePackages /></WebsiteProvider>} />
              <Route path="/site/contact" element={<WebsiteProvider><SiteContact /></WebsiteProvider>} />
              <Route path="/site/pricing" element={<SitePricing />} />

              {/* App routes (protected) */}
              <Route path="/dashboard" element={<P><Dashboard /></P>} />
              <Route path="/clients" element={<P><Clients /></P>} />
              <Route path="/agents" element={<P><Agents /></P>} />
              <Route path="/vendors" element={<P><Vendors /></P>} />
              <Route path="/leads" element={<P><Leads /></P>} />
              <Route path="/tasks" element={<P><Tasks /></P>} />
              <Route path="/bookings" element={<P><Bookings /></P>} />
              <Route path="/invoices" element={<P><Invoices /></P>} />
              <Route path="/accounts" element={<P><Accounts /></P>} />
              <Route path="/reports" element={<P><Reports /></P>} />
              <Route path="/hajj-umrah" element={<P><HajjUmrah /></P>} />
              <Route path="/subscription" element={<P><Subscriptions /></P>} />
              <Route path="/payment/callback" element={<P><PaymentCallback /></P>} />
              <Route path="/team" element={<P><Team /></P>} />
              <Route path="/organization" element={<P><Organization /></P>} />
              <Route path="/settings" element={<P><SettingsPage /></P>} />
              <Route path="/website" element={<P><WebsiteCustomizer /></P>} />

              {/* Admin routes */}
              <Route path="/admin" element={<A><AdminDashboard /></A>} />
              <Route path="/admin/tenants" element={<A><AdminTenants /></A>} />
              <Route path="/admin/tenants/:tenantId" element={<A><AdminTenantDetails /></A>} />
              <Route path="/admin/payments" element={<A><AdminPayments /></A>} />
              <Route path="/admin/plans" element={<A><AdminPlans /></A>} />
              <Route path="/admin/domains" element={<A><AdminDomains /></A>} />
              <Route path="/admin/subscriptions" element={<A><AdminSubscriptions /></A>} />
              <Route path="/admin/settings" element={<A><AdminSettings /></A>} />
              <Route path="/admin/features" element={<A><AdminFeatures /></A>} />
              <Route path="/admin/sms-templates" element={<A><AdminSmsTemplates /></A>} />
              <Route path="/admin/sms-logs" element={<A><AdminSmsLogs /></A>} />

              <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => {
  const inRouterContext = useInRouterContext();

  if (inRouterContext) {
    return <AppContent />;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
