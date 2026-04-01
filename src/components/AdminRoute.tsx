import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mapLegacyRole } from "@/lib/permissions";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const role = mapLegacyRole(user.role);
  if (role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
