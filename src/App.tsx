import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Organization from "./pages/Organization";
import SettingsPage from "./pages/SettingsPage";
import Clients from "./pages/Clients";
import Agents from "./pages/Agents";
import Vendors from "./pages/Vendors";
import Leads from "./pages/Leads";
import Tasks from "./pages/Tasks";
import Bookings from "./pages/Bookings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/clients" element={<P><Clients /></P>} />
            <Route path="/agents" element={<P><Agents /></P>} />
            <Route path="/vendors" element={<P><Vendors /></P>} />
            <Route path="/leads" element={<P><Leads /></P>} />
            <Route path="/tasks" element={<P><Tasks /></P>} />
            <Route path="/team" element={<P><Team /></P>} />
            <Route path="/organization" element={<P><Organization /></P>} />
            <Route path="/settings" element={<P><SettingsPage /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
