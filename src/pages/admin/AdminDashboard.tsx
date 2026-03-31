import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2, CreditCard, Users, Crown, TrendingUp, TrendingDown,
  DollarSign, UserPlus, Activity, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

// ── Mock data generators ──
const generateRevenueData = (period: string) => {
  if (period === "7d") {
    return [
      { name: "Mar 25", revenue: 4500, subscriptions: 3 },
      { name: "Mar 26", revenue: 2800, subscriptions: 1 },
      { name: "Mar 27", revenue: 6200, subscriptions: 4 },
      { name: "Mar 28", revenue: 3900, subscriptions: 2 },
      { name: "Mar 29", revenue: 7100, subscriptions: 5 },
      { name: "Mar 30", revenue: 5400, subscriptions: 3 },
      { name: "Mar 31", revenue: 8200, subscriptions: 6 },
    ];
  }
  if (period === "30d") {
    return Array.from({ length: 30 }, (_, i) => ({
      name: `Mar ${i + 1}`,
      revenue: Math.floor(2000 + Math.random() * 8000),
      subscriptions: Math.floor(1 + Math.random() * 6),
    }));
  }
  // 12 months
  return [
    { name: "Apr", revenue: 45000, subscriptions: 12 },
    { name: "May", revenue: 52000, subscriptions: 15 },
    { name: "Jun", revenue: 48000, subscriptions: 11 },
    { name: "Jul", revenue: 61000, subscriptions: 18 },
    { name: "Aug", revenue: 58000, subscriptions: 16 },
    { name: "Sep", revenue: 72000, subscriptions: 22 },
    { name: "Oct", revenue: 68000, subscriptions: 20 },
    { name: "Nov", revenue: 85000, subscriptions: 28 },
    { name: "Dec", revenue: 92000, subscriptions: 32 },
    { name: "Jan", revenue: 78000, subscriptions: 25 },
    { name: "Feb", revenue: 95000, subscriptions: 35 },
    { name: "Mar", revenue: 110000, subscriptions: 42 },
  ];
};

const generateNewTenants = (period: string) => {
  if (period === "7d") {
    return [
      { name: "Mar 25", newTenants: 2 },
      { name: "Mar 26", newTenants: 1 },
      { name: "Mar 27", newTenants: 3 },
      { name: "Mar 28", newTenants: 0 },
      { name: "Mar 29", newTenants: 4 },
      { name: "Mar 30", newTenants: 2 },
      { name: "Mar 31", newTenants: 5 },
    ];
  }
  if (period === "30d") {
    return Array.from({ length: 30 }, (_, i) => ({
      name: `Mar ${i + 1}`,
      newTenants: Math.floor(Math.random() * 6),
    }));
  }
  return [
    { name: "Apr", newTenants: 8 },
    { name: "May", newTenants: 12 },
    { name: "Jun", newTenants: 10 },
    { name: "Jul", newTenants: 15 },
    { name: "Aug", newTenants: 13 },
    { name: "Sep", newTenants: 18 },
    { name: "Oct", newTenants: 16 },
    { name: "Nov", newTenants: 22 },
    { name: "Dec", newTenants: 25 },
    { name: "Jan", newTenants: 20 },
    { name: "Feb", newTenants: 28 },
    { name: "Mar", newTenants: 35 },
  ];
};

const subscriptionDistribution = [
  { name: "Active", value: 142, color: "hsl(var(--primary))" },
  { name: "Expired", value: 38, color: "hsl(45, 93%, 47%)" },
  { name: "Cancelled", value: 15, color: "hsl(0, 72%, 51%)" },
];

const planDistribution = [
  { plan: "Free", count: 65, color: "hsl(var(--muted-foreground))" },
  { plan: "Basic", count: 48, color: "hsl(210, 100%, 50%)" },
  { plan: "Pro", count: 52, color: "hsl(var(--primary))" },
  { plan: "Business", count: 25, color: "hsl(142, 71%, 45%)" },
  { plan: "Enterprise", count: 5, color: "hsl(280, 68%, 50%)" },
];

const AdminDashboard = () => {
  const [period, setPeriod] = useState("12m");

  const revenueData = useMemo(() => generateRevenueData(period), [period]);
  const tenantData = useMemo(() => generateNewTenants(period), [period]);

  const totalRevenue = useMemo(() => revenueData.reduce((s, d) => s + d.revenue, 0), [revenueData]);
  const totalNewTenants = useMemo(() => tenantData.reduce((s, d) => s + d.newTenants, 0), [tenantData]);
  const totalSubs = subscriptionDistribution.reduce((s, d) => s + d.value, 0);

  const stats = [
    { title: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, change: "+18.2%", up: true },
    { title: "Total Tenants", value: "195", icon: Building2, change: "+12 this month", up: true },
    { title: "Active Subscriptions", value: "142", icon: Crown, change: "+8.5%", up: true },
    { title: "Pending Payments", value: "5", icon: CreditCard, change: "3 new today", up: false },
    { title: "New Tenants", value: totalNewTenants.toString(), icon: UserPlus, change: period === "12m" ? "this year" : period === "30d" ? "this month" : "this week", up: true },
    { title: "Total Users", value: "847", icon: Users, change: "+23 this month", up: true },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform analytics and overview</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.title}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{s.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {s.up ? <TrendingUp className="h-3 w-3 text-green-500" /> : <Activity className="h-3 w-3 text-yellow-500" />}
                  {s.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Line Chart + Subscription Bar Chart */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Overview
              </CardTitle>
              <CardDescription>Monthly revenue trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`৳${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                New Subscriptions
              </CardTitle>
              <CardDescription>Subscription growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="subscriptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Tenants + Pie Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* New Tenants Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                New Tenants
              </CardTitle>
              <CardDescription>Tenant registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenantData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="newTenants" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status Pie */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>Active vs expired vs cancelled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {subscriptionDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {subscriptionDistribution.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
              <CardDescription>Tenants by subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {planDistribution.map((p) => {
                  const pct = Math.round((p.count / totalSubs) * 100);
                  return (
                    <div key={p.plan} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{p.plan}</span>
                        <span className="text-muted-foreground">{p.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{totalSubs} subscriptions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { text: "Acme Travel upgraded to Pro plan", time: "2 minutes ago", type: "upgrade" },
                { text: "New tenant registered: Dream Trips", time: "15 minutes ago", type: "new" },
                { text: "Payment approved for Globe Tours (৳999)", time: "1 hour ago", type: "payment" },
                { text: "Star Holidays subscription expired", time: "3 hours ago", type: "expired" },
                { text: "Royal Travels payment rejected", time: "5 hours ago", type: "rejected" },
                { text: "New tenant registered: Sky Wings", time: "8 hours ago", type: "new" },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    event.type === "upgrade" ? "bg-primary" :
                    event.type === "new" ? "bg-green-500" :
                    event.type === "payment" ? "bg-blue-500" :
                    event.type === "expired" ? "bg-yellow-500" :
                    "bg-red-500"
                  }`} />
                  <span className="flex-1">{event.text}</span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">{event.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
