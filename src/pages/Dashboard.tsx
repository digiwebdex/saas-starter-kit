import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Plane, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardApi, type DashboardStats, type Booking, type Payment, type Client, type User as ApiUser, clientApi, bookingApi, paymentApi, tenantApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      // Try dedicated stats endpoint first
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch {
      // Fallback: fetch individual resources
      try {
        const [members, clients, bookings, payments] = await Promise.all([
          tenantApi.getMembers().catch(() => []),
          clientApi.list().catch(() => []),
          bookingApi.list().catch(() => []),
          paymentApi.list().catch(() => []),
        ]);

        const totalRevenue = bookings.reduce<number>((sum, b) => sum + (b.amount || 0), 0);

        setStats({
          totalUsers: members.length,
          totalClients: clients.length,
          totalBookings: bookings.length,
          totalRevenue,
          recentBookings: bookings.slice(-5).reverse(),
          recentPayments: payments.slice(-5).reverse(),
        });
      } catch {
        setError(true);
        toast({ title: "Failed to load dashboard data", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { title: "Total Clients", value: stats?.totalClients ?? 0, icon: UserCheck, color: "text-emerald-600" },
    { title: "Total Bookings", value: stats?.totalBookings ?? 0, icon: Plane, color: "text-violet-600" },
    { title: "Total Revenue", value: `৳${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your real-time overview.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{s.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Bookings & Payments */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plane className="h-5 w-5" /> Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !stats?.recentBookings?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="capitalize font-medium">{b.type}</TableCell>
                        <TableCell className="text-right">৳{b.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[b.status] || ""}`}>
                            {b.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" /> Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !stats?.recentPayments?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No payments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize font-medium">{p.method}</TableCell>
                        <TableCell className="text-right">৳{p.amount?.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(p.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
