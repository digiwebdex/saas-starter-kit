import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, Plane, DollarSign, RefreshCw, FileText, Clock, AlertTriangle,
  TrendingUp, CreditCard, MapPin, CalendarDays, UserPlus, CheckCircle2,
  ArrowRight, Send, Briefcase, ReceiptText, Building2,
} from "lucide-react";
import {
  dashboardApi, type DashboardStats, type Booking, type Payment,
  clientApi, bookingApi, paymentApi, tenantApi, leadApi, quotationApi, invoiceApi, vendorApi,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/EmptyState";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ticketed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  traveling: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch {
      // Fallback: fetch individual resources and compute stats
      try {
        const today = new Date().toISOString().split("T")[0];
        const thisMonth = new Date().toISOString().slice(0, 7);
        const next7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

        const [members, clients, bookings, payments, leads, quotations, invoices, vendorBills] = await Promise.all([
          tenantApi.getMembers().catch(() => []),
          clientApi.list().catch(() => []),
          bookingApi.list().catch(() => []),
          paymentApi.list().catch(() => []),
          leadApi.list().catch(() => []),
          quotationApi.list().catch(() => []),
          invoiceApi.list().catch(() => []),
          vendorApi.getPayableReport().catch(() => []),
        ]);

        const activeLeads = leads.filter((l: any) => !["won", "lost"].includes(l.status)).length;
        const followUpsDueToday = leads.filter((l: any) => l.nextFollowUp && l.nextFollowUp <= today && !["won", "lost"].includes(l.status)).length;
        const quotationsSentThisMonth = quotations.filter((q: any) => q.status === "sent" && q.createdAt?.startsWith(thisMonth)).length;
        const quotationsAwaitingApproval = quotations.filter((q: any) => q.status === "sent").length;
        const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed").length;
        const upcomingDepartures = bookings.filter((b: any) =>
          b.travelDateFrom && b.travelDateFrom >= today && b.travelDateFrom <= next7Days &&
          ["confirmed", "ticketed"].includes(b.status)
        ).length;
        const overdueInvoicesList = invoices.filter((i: any) => i.status === "overdue" || (i.status !== "paid" && i.status !== "cancelled" && i.dueDate && i.dueDate < today));
        const overdueInvoices = overdueInvoicesList.length;
        const overdueInvoiceAmount = overdueInvoicesList.reduce((s: number, i: any) => s + (i.dueAmount || 0), 0);
        const vendorDues = vendorBills.reduce((s: number, b: any) => s + (b.dueAmount || 0), 0);
        const salesThisMonth = payments.filter((p: any) => p.date?.startsWith(thisMonth) || p.createdAt?.startsWith(thisMonth)).reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const totalRevenue = bookings.reduce((s: number, b: any) => s + (b.amount || 0), 0);

        // Top destinations
        const destMap: Record<string, number> = {};
        bookings.forEach((b: any) => { if (b.destination) destMap[b.destination] = (destMap[b.destination] || 0) + 1; });
        const topDestinations = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([destination, count]) => ({ destination, count }));

        setStats({
          totalUsers: members.length,
          totalClients: clients.length,
          totalBookings: bookings.length,
          totalRevenue,
          recentBookings: bookings.slice(-5).reverse(),
          recentPayments: payments.slice(-5).reverse(),
          activeLeads,
          followUpsDueToday,
          quotationsSentThisMonth,
          quotationsAwaitingApproval,
          confirmedBookings,
          upcomingDepartures,
          overdueInvoices,
          overdueInvoiceAmount,
          vendorDues,
          salesThisMonth,
          topDestinations,
        });
      } catch {
        toast({ title: "Failed to load dashboard", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const hasAnyData = stats && (stats.totalBookings > 0 || stats.totalClients > 0 || stats.activeLeads > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your agency at a glance — leads, bookings, payments, and operations.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* First-time empty state */}
        {!loading && !hasAnyData && (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold">Welcome to your travel agency dashboard</h2>
                  <p className="text-muted-foreground mt-1 max-w-lg mx-auto">
                    Start by adding a lead, sending a quotation, or creating a booking.
                    Your operational summary will appear here as you grow.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button onClick={() => navigate("/leads")}><UserPlus className="mr-2 h-4 w-4" /> Add a Lead</Button>
                  <Button variant="outline" onClick={() => navigate("/quotations/new")}><Send className="mr-2 h-4 w-4" /> Create Quotation</Button>
                  <Button variant="outline" onClick={() => navigate("/bookings")}><Plane className="mr-2 h-4 w-4" /> New Booking</Button>
                  <Button variant="outline" onClick={() => navigate("/invoices")}><ReceiptText className="mr-2 h-4 w-4" /> Create Invoice</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── KPI Row 1: Pipeline ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <WidgetCard
            title="Active Leads" value={stats?.activeLeads ?? 0} icon={UserPlus}
            color="text-blue-600" loading={loading}
            onClick={() => navigate("/leads")}
            subtitle={stats?.followUpsDueToday ? `${stats.followUpsDueToday} follow-up${stats.followUpsDueToday > 1 ? "s" : ""} due today` : undefined}
            subtitleColor={stats?.followUpsDueToday ? "text-orange-600 dark:text-orange-400" : undefined}
          />
          <WidgetCard
            title="Quotations Sent" value={stats?.quotationsSentThisMonth ?? 0} icon={Send}
            color="text-indigo-600" loading={loading}
            onClick={() => navigate("/quotations")}
            subtitle={stats?.quotationsAwaitingApproval ? `${stats.quotationsAwaitingApproval} awaiting approval` : undefined}
          />
          <WidgetCard
            title="Confirmed Bookings" value={stats?.confirmedBookings ?? 0} icon={CheckCircle2}
            color="text-emerald-600" loading={loading}
            onClick={() => navigate("/bookings")}
          />
          <WidgetCard
            title="Upcoming Departures" value={stats?.upcomingDepartures ?? 0} icon={Plane}
            color="text-violet-600" loading={loading}
            onClick={() => navigate("/bookings")}
            subtitle="Next 7 days"
          />
        </div>

        {/* ── KPI Row 2: Financial ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <WidgetCard
            title="Sales This Month" value={`৳${(stats?.salesThisMonth ?? 0).toLocaleString()}`}
            icon={TrendingUp} color="text-emerald-600" loading={loading}
          />
          <WidgetCard
            title="Overdue Invoices" value={stats?.overdueInvoices ?? 0}
            icon={AlertTriangle} color="text-destructive" loading={loading}
            onClick={() => navigate("/invoices")}
            subtitle={stats?.overdueInvoiceAmount ? `৳${stats.overdueInvoiceAmount.toLocaleString()} outstanding` : undefined}
            subtitleColor="text-destructive"
          />
          <WidgetCard
            title="Vendor Dues" value={`৳${(stats?.vendorDues ?? 0).toLocaleString()}`}
            icon={Building2} color="text-orange-600" loading={loading}
            onClick={() => navigate("/vendors")}
          />
          <WidgetCard
            title="Total Revenue" value={`৳${(stats?.totalRevenue ?? 0).toLocaleString()}`}
            icon={DollarSign} color="text-amber-600" loading={loading}
          />
        </div>

        {/* ── Main Content ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Bookings */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><Plane className="h-5 w-5" /> Recent Bookings</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/bookings")}>View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !stats?.recentBookings?.length ? (
                <EmptyState icon={Plane} title="No bookings yet" description="Create your first booking from a confirmed quotation or directly." actionLabel="New Booking" onAction={() => navigate("/bookings")} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Travel Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentBookings.map((b) => (
                      <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/bookings/${b.id}`)}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{b.title || b.clientName || b.type}</p>
                            <p className="text-xs text-muted-foreground capitalize">{b.type}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{b.destination || "—"}</TableCell>
                        <TableCell className="text-right font-medium">৳{b.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[b.status] || ""}`}>
                            {b.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {b.travelDateFrom ? new Date(b.travelDateFrom).toLocaleDateString() : new Date(b.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Top Destinations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5" /> Top Destinations</CardTitle>
              <CardDescription>By booking count</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : !stats?.topDestinations?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">Destination data will appear as bookings grow.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topDestinations.map((d, i) => {
                    const maxCount = stats.topDestinations[0]?.count || 1;
                    return (
                      <div key={d.destination} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{d.destination}</span>
                          <Badge variant="secondary">{d.count}</Badge>
                        </div>
                        <Progress value={(d.count / maxCount) * 100} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5" /> Recent Payments</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !stats?.recentPayments?.length ? (
                <EmptyState icon={CreditCard} title="No payments yet" description="Payments will show here once you record them against invoices." actionLabel="Go to Invoices" onAction={() => navigate("/invoices")} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize font-medium text-sm">{p.method}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">৳{p.amount?.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.transactionRef || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(p.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5" /> Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Total Clients" value={stats?.totalClients ?? 0} loading={loading} />
                <MiniStat label="Total Bookings" value={stats?.totalBookings ?? 0} loading={loading} />
                <MiniStat label="Team Members" value={stats?.totalUsers ?? 0} loading={loading} />
                <MiniStat label="Follow-ups Today" value={stats?.followUpsDueToday ?? 0} loading={loading} highlight={!!stats?.followUpsDueToday} />
              </div>
              <div className="pt-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate("/leads")}><UserPlus className="mr-1 h-3.5 w-3.5" /> New Lead</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/quotations/new")}><Send className="mr-1 h-3.5 w-3.5" /> Quotation</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/bookings")}><Plane className="mr-1 h-3.5 w-3.5" /> Booking</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/invoices")}><FileText className="mr-1 h-3.5 w-3.5" /> Invoice</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── Widget Card ──
function WidgetCard({
  title, value, icon: Icon, color, loading, onClick, subtitle, subtitleColor,
}: {
  title: string; value: string | number; icon: any; color: string; loading: boolean;
  onClick?: () => void; subtitle?: string; subtitleColor?: string;
}) {
  return (
    <Card
      className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className={`text-xs mt-0.5 ${subtitleColor || "text-muted-foreground"}`}>{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Mini Stat ──
function MiniStat({ label, value, loading, highlight }: { label: string; value: number; loading: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-orange-300 dark:border-orange-600" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="h-6 w-12 mt-1" /> : (
        <p className={`text-lg font-bold ${highlight ? "text-orange-600 dark:text-orange-400" : ""}`}>{value}</p>
      )}
    </div>
  );
}

export default Dashboard;
