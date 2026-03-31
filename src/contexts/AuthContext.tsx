import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, tenantApi, type User, type Tenant } from "@/lib/api";
import type { PlanType } from "@/lib/plans";

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  currentPlan: PlanType;
  isSubscriptionExpired: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; tenantName: string }) => Promise<User>;
  logout: () => void;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPlan: PlanType = (tenant?.subscriptionPlan as PlanType) || "free";

  const isSubscriptionExpired = (() => {
    if (!tenant) return false;
    if (currentPlan === "free") return false; // Free never expires
    if (tenant.subscriptionStatus === "expired" || tenant.subscriptionStatus === "cancelled") return true;
    if (tenant.subscriptionExpiry) {
      return new Date(tenant.subscriptionExpiry) < new Date();
    }
    return false;
  })();

  const fetchTenant = async () => {
    try {
      const t = await tenantApi.get();
      setTenant(t);
    } catch {
      // Tenant fetch failed, use defaults
    }
  };

  const refreshTenant = useCallback(async () => {
    await fetchTenant();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([
      authApi.me().catch(() => { localStorage.removeItem("token"); return null; }),
      tenantApi.get().catch(() => null),
    ]).then(([u, t]) => {
      if (u) setUser(u);
      if (t) setTenant(t);
    }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("token", res.token);
    setUser(res.user);
    fetchTenant();
    return res.user;
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; tenantName: string }) => {
      const res = await authApi.register(data);
      localStorage.setItem("token", res.token);
      setUser(res.user);
      fetchTenant();
      return res.user;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setTenant(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenant, currentPlan, isSubscriptionExpired, loading, login, register, logout, refreshTenant }}>
      {children}
    </AuthContext.Provider>
  );
};
