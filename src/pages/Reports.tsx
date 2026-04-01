import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Plane,
  Download, Filter, Calendar,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

// ── Mock Data ──
const mockBookings = [
  { id: "b1", type: "tour", clientId: "c1", clientName: "Rahman Ali", agentId: "a1", agentName: "Karim Ahmed", vendorId: "v1", vendorName: "Sky Airlines", amount: 45000, cost: 35000, profit: 10000, status: "confirmed", date: "2026-01-15" },
  { id: "b2", type: "ticket", clientId: "c2", clientName: "Fatima Begum", agentId: "a1", agentName: "Karim Ahmed", vendorId: "v2", vendorName: "Biman BD", amount: 12000, cost: 10500, profit: 1500, status: "completed", date: "2026-01-22" },
  { id: "b3", type: "hotel", clientId: "c3", clientName: "Jamal Uddin", agentId: "a2", agentName: "Nasir Hossain", vendorId: "v3", vendorName: "Hotel Grand", amount: 28000, cost: 22000, profit: 6000, status: "confirmed", date: "2026-02-05" },
  { id: "b4", type: "visa", clientId: "c1", clientName: "Rahman Ali", agentId: "a2", agentName: "Nasir Hossain", vendorId: "v4", vendorName: "Visa Center", amount: 15000, cost: 8000, profit: 7000, status: "completed", date: "2026-02-18" },
  { id: "b5", type: "tour", clientId: "c4", clientName: "Sakib Hasan", agentId: "a3", agentName: "Tanvir Islam", vendorId: "v1", vendorName: "Sky Airlines", amount: 65000, cost: 52000, profit: 13000, status: "confirmed", date: "2026-02-25" },
  { id: "b6", type: "ticket", clientId: "c5", clientName: "Nusrat Jahan", agentId: "a1", agentName: "Karim Ahmed", vendorId: "v2", vendorName: "Biman BD", amount: 8500, cost: 7200, profit: 1300, status: "completed", date: "2026-03-02" },
  { id: "b7", type: "hotel", clientId: "c2", clientName: "Fatima Begum", agentId: "a3", agentName: "Tanvir Islam", vendorId: "v3", vendorName: "Hotel Grand", amount: 35000, cost: 28000, profit: 7000, status: "pending", date: "2026-03-10" },
  { id: "b8", type: "tour", clientId: "c3", clientName: "Jamal Uddin", agentId: "a2", agentName: "Nasir Hossain", vendorId: "v5", vendorName: "Tour BD", amount: 92000, cost: 75000, profit: 17000, status: "confirmed", date: "2026-03-15" },
  { id: "b9", type: "visa", clientId: "c6", clientName: "Arif Hossain", agentId: "a1", agentName: "Karim Ahmed", vendorId: "v4", vendorName: "Visa Center", amount: 18000, cost: 10000, profit: 8000, status: "completed", date: "2026-03-20" },
  { id: "b10", type: "ticket", clientId: "c4", clientName: "Sakib Hasan", agentId: "a3", agentName: "Tanvir Islam", vendorId: "v2", vendorName: "Biman BD", amount: 22000, cost: 18500, profit: 3500, status: "confirmed", date: "2026-03-28" },
];

const mockExpenses = [
  { id: "e1", category: "Office Rent", vendorName: "Property Co", amount: 25000, date: "2026-01-01" },
  { id: "e2", category: "Utilities", vendorName: "DESCO", amount: 5000, date: "2026-01-15" },
  { id: "e3", category: "Marketing", vendorName: "Ad Agency", amount: 15000, date: "2026-02-01" },
  { id: "e4", category: "Office Rent", vendorName: "Property Co", amount: 25000, date: "2026-02-01" },
  { id: "e5", category: "Staff Salary", vendorName: "Payroll", amount: 80000, date: "2026-02-28" },
  { id: "e6", category: "Utilities", vendorName: "DESCO", amount: 4500, date: "2026-03-01" },
  { id: "e7", category: "Office Rent", vendorName: "Property Co", amount: 25000, date: "2026-03-01" },
  { id: "e8", category: "Marketing", vendorName: "Ad Agency", amount: 12000, date: "2026-03-15" },
  { id: "e9", category: "Staff Salary", vendorName: "Payroll", amount: 80000, date: "2026-03-28" },
];

const mockAgentCommissions = [
  { agentId: "a1", agentName: "Karim Ahmed", totalSales: 83500, commissionRate: 5, totalCommission: 4175, paidCommission: 3000, dueCommission: 1175, bookingsCount: 4 },
  { agentId: "a2", agentName: "Nasir Hossain", totalSales: 135000, commissionRate: 5, totalCommission: 6750, paidCommission: 4000, dueCommission: 2750, bookingsCount: 3 },
  { agentId: "a3", agentName: "Tanvir Islam", totalSales: 122000, commissionRate: 5, totalCommission: 6100, paidCommission: 6100, dueCommission: 0, bookingsCount: 3 },
];

const mockLeads = [
  { id: "l1", name: "Ahmed Khan", source: "Website", destination: "Maldives", status: "won", assignedTo: "Karim Ahmed", date: "2026-01-10" },
  { id: "l2", name: "Sara Akter", source: "Facebook", destination: "Turkey", status: "won", assignedTo: "Nasir Hossain", date: "2026-01-15" },
  { id: "l3", name: "Rahim Sheikh", source: "Referral", destination: "Dubai", status: "lost", assignedTo: "Karim Ahmed", date: "2026-01-20" },
  { id: "l4", name: "Hasina Begum", source: "Website", destination: "Thailand", status: "qualified", assignedTo: "Tanvir Islam", date: "2026-02-01" },
  { id: "l5", name: "Kamal Hasan", source: "Walk-in", destination: "Singapore", status: "won", assignedTo: "Karim Ahmed", date: "2026-02-10" },
  { id: "l6", name: "Nadia Islam", source: "Facebook", destination: "Malaysia", status: "contacted", assignedTo: "Nasir Hossain", date: "2026-02-15" },
  { id: "l7", name: "Tariq Rahman", source: "Website", destination: "Cox's Bazar", status: "won", assignedTo: "Tanvir Islam", date: "2026-02-25" },
  { id: "l8", name: "Farida Noor", source: "Referral", destination: "Bali", status: "new", assignedTo: "Karim Ahmed", date: "2026-03-01" },
  { id: "l9", name: "Imran Ali", source: "Facebook", destination: "Egypt", status: "quoted", assignedTo: "Nasir Hossain", date: "2026-03-10" },
  { id: "l10", name: "Salma Khatun", source: "Walk-in", destination: "Nepal", status: "lost", assignedTo: "Tanvir Islam", date: "2026-03-15" },
  { id: "l11", name: "Riyad Haque", source: "Website", destination: "Japan", status: "won", assignedTo: "Karim Ahmed", date: "2026-03-20" },
  { id: "l12", name: "Mitu Das", source: "Referral", destination: "Vietnam", status: "qualified", assignedTo: "Nasir Hossain", date: "2026-03-25" },
];

const mockQuotations = [
  { id: "q1", title: "Maldives Luxury Package", clientName: "Ahmed Khan", amount: 125000, status: "approved", date: "2026-01-12" },
  { id: "q2", title: "Turkey Cultural Tour", clientName: "Sara Akter", amount: 85000, status: "approved", date: "2026-01-18" },
  { id: "q3", title: "Dubai City Break", clientName: "Rahim Sheikh", amount: 65000, status: "rejected", date: "2026-01-25" },
  { id: "q4", title: "Thailand Beach Holiday", clientName: "Hasina Begum", amount: 55000, status: "sent", date: "2026-02-05" },
  { id: "q5", title: "Singapore Explorer", clientName: "Kamal Hasan", amount: 92000, status: "approved", date: "2026-02-12" },
  { id: "q6", title: "Cox's Bazar Getaway", clientName: "Tariq Rahman", amount: 25000, status: "approved", date: "2026-02-28" },
  { id: "q7", title: "Bali Adventure", clientName: "Farida Noor", amount: 110000, status: "draft", date: "2026-03-05" },
  { id: "q8", title: "Egypt Heritage Tour", clientName: "Imran Ali", amount: 78000, status: "sent", date: "2026-03-12" },
  { id: "q9", title: "Nepal Trekking", clientName: "Salma Khatun", amount: 45000, status: "expired", date: "2026-03-18" },
  { id: "q10", title: "Japan Cherry Blossom", clientName: "Riyad Haque", amount: 185000, status: "approved", date: "2026-03-22" },
];

const mockDuePayments = [
  { invoiceId: "INV-2026-003", clientName: "Fatima Begum", amount: 18000, paid: 10000, due: 8000, dueDate: "2026-03-15", status: "overdue" as const },
  { invoiceId: "INV-2026-005", clientName: "Sakib Hasan", amount: 65000, paid: 30000, due: 35000, dueDate: "2026-03-20", status: "overdue" as const },
  { invoiceId: "INV-2026-007", clientName: "Jamal Uddin", amount: 92000, paid: 50000, due: 42000, dueDate: "2026-04-05", status: "upcoming" as const },
  { invoiceId: "INV-2026-009", clientName: "Arif Hossain", amount: 18000, paid: 0, due: 18000, dueDate: "2026-04-10", status: "upcoming" as const },
];

const clients = [...new Map(mockBookings.map((b) => [b.clientId, { id: b.clientId, name: b.clientName }])).values()];
const agents = [...new Map(mockBookings.map((b) => [b.agentId, { id: b.agentId, name: b.agentName }])).values()];

// ── Helper: Date Picker ──
function DatePicker({ date, onChange, label }: { date: Date | undefined; onChange: (d: Date | undefined) => void; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[140px]", !date && "text-muted-foreground")}>
          <Calendar className="mr-2 h-3.5 w-3.5" />
          {date ? format(date, "dd MMM yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent mode="single" selected={date} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}

// ── Stat Card ──
function StatCard({ title, value, icon: Icon, trend, trendLabel, variant = "default" }: {
  title: string; value: string; icon: React.ElementType; trend?: number; trendLabel?: string;
  variant?: "default" | "success" | "danger";
}) {
  const iconColor = variant === "success" ? "text-green-600" : variant === "danger" ? "text-destructive" : "text-primary";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-destructive"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}% {trendLabel || "vs last month"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════
const Reports = () => {
  // Filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subMonths(new Date(), 3));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [filterClient, setFilterClient] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return mockBookings.filter((b) => {
      const d = parseISO(b.date);
      if (dateFrom && dateTo && !isWithinInterval(d, { start: dateFrom, end: dateTo })) return false;
      if (filterClient !== "all" && b.clientId !== filterClient) return false;
      if (filterAgent !== "all" && b.agentId !== filterAgent) return false;
      return true;
    });
  }, [dateFrom, dateTo, filterClient, filterAgent]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter((e) => {
      const d = parseISO(e.date);
      if (dateFrom && dateTo && !isWithinInterval(d, { start: dateFrom, end: dateTo })) return false;
      return true;
    });
  }, [dateFrom, dateTo]);

  // ── Sales Data ──
  const salesData = useMemo(() => {
    const totalSales = filteredBookings.reduce((s, b) => s + b.amount, 0);
    const totalBookings = filteredBookings.length;
    const byType = filteredBookings.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + b.amount;
      return acc;
    }, {} as Record<string, number>);
    const byTypeArr = Object.entries(byType).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    // Monthly trend
    const byMonth: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      const m = format(parseISO(b.date), "MMM yyyy");
      byMonth[m] = (byMonth[m] || 0) + b.amount;
    });
    const monthlyTrend = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));

    return { totalSales, totalBookings, byTypeArr, monthlyTrend };
  }, [filteredBookings]);

  // ── Expense Data ──
  const expenseData = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const vendorCosts = filteredBookings.reduce((s, b) => s + b.cost, 0);
    const byCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const byCategoryArr = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    const byMonth: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const m = format(parseISO(e.date), "MMM yyyy");
      byMonth[m] = (byMonth[m] || 0) + e.amount;
    });
    const monthlyTrend = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));

    return { totalExpenses, vendorCosts, byCategoryArr, monthlyTrend };
  }, [filteredExpenses, filteredBookings]);

  // ── Profit Data ──
  const profitData = useMemo(() => {
    const totalIncome = filteredBookings.reduce((s, b) => s + b.amount, 0);
    const totalCost = filteredBookings.reduce((s, b) => s + b.cost, 0);
    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const grossProfit = totalIncome - totalCost;
    const netProfit = grossProfit - totalExpense;

    // Per-booking profit
    const bookingProfits = filteredBookings.map((b) => ({
      id: b.id,
      type: b.type,
      clientName: b.clientName,
      amount: b.amount,
      cost: b.cost,
      profit: b.profit,
      margin: b.amount > 0 ? ((b.profit / b.amount) * 100).toFixed(1) : "0",
      date: b.date,
    }));

    // Monthly income vs expense
    const months = new Set<string>();
    filteredBookings.forEach((b) => months.add(format(parseISO(b.date), "MMM yyyy")));
    filteredExpenses.forEach((e) => months.add(format(parseISO(e.date), "MMM yyyy")));
    const comparison = [...months].sort().map((month) => {
      const income = filteredBookings.filter((b) => format(parseISO(b.date), "MMM yyyy") === month).reduce((s, b) => s + b.amount, 0);
      const cost = filteredBookings.filter((b) => format(parseISO(b.date), "MMM yyyy") === month).reduce((s, b) => s + b.cost, 0);
      const expense = filteredExpenses.filter((e) => format(parseISO(e.date), "MMM yyyy") === month).reduce((s, e) => s + e.amount, 0);
      return { month, income, cost, expense, profit: income - cost - expense };
    });

    return { totalIncome, totalCost, totalExpense, grossProfit, netProfit, bookingProfits, comparison };
  }, [filteredBookings, filteredExpenses]);

  // ── Agent Commission Data ──
  const commissionData = useMemo(() => {
    const totalCommission = mockAgentCommissions.reduce((s, a) => s + a.totalCommission, 0);
    const totalPaid = mockAgentCommissions.reduce((s, a) => s + a.paidCommission, 0);
    const totalDue = mockAgentCommissions.reduce((s, a) => s + a.dueCommission, 0);
    return { totalCommission, totalPaid, totalDue, agents: mockAgentCommissions };
  }, []);

  const resetFilters = () => {
    setDateFrom(subMonths(new Date(), 3));
    setDateTo(new Date());
    setFilterClient("all");
    setFilterAgent("all");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Sales, Expense, Profit & Agent Commission Reports</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <DatePicker date={dateFrom} onChange={setDateFrom} label="From date" />
              <DatePicker date={dateTo} onChange={setDateTo} label="To date" />
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
            <TabsTrigger value="due">Due Payments</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="commission">Commission</TabsTrigger>
          </TabsList>

          {/* ═══ SALES TAB ═══ */}
          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Total Sales" value={`৳${salesData.totalSales.toLocaleString()}`} icon={DollarSign} trend={12} variant="success" />
              <StatCard title="Total Bookings" value={salesData.totalBookings.toString()} icon={Plane} trend={8} />
              <StatCard title="Avg. Booking Value" value={`৳${salesData.totalBookings > 0 ? Math.round(salesData.totalSales / salesData.totalBookings).toLocaleString() : 0}`} icon={TrendingUp} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Monthly Sales Trend */}
              <Card>
                <CardHeader><CardTitle className="text-base">Monthly Sales Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={salesData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, "Sales"]} />
                      <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales by Type */}
              <Card>
                <CardHeader><CardTitle className="text-base">Sales by Type</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={salesData.byTypeArr} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {salesData.byTypeArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Sales Table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Sales Details</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-sm">{b.date}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{b.type}</Badge></TableCell>
                        <TableCell className="font-medium">{b.clientName}</TableCell>
                        <TableCell className="text-muted-foreground">{b.agentName}</TableCell>
                        <TableCell className="text-right font-semibold">৳{b.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={b.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : b.status === "confirmed" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}>
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ LEADS TAB ═══ */}
          <TabsContent value="leads" className="space-y-4">
            {(() => {
              const totalLeads = mockLeads.length;
              const won = mockLeads.filter((l) => l.status === "won").length;
              const lost = mockLeads.filter((l) => l.status === "lost").length;
              const conversionRate = totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : "0";
              const bySource = ["Website", "Facebook", "Referral", "Walk-in"].map((s) => ({
                name: s,
                total: mockLeads.filter((l) => l.source === s).length,
                won: mockLeads.filter((l) => l.source === s && l.status === "won").length,
              }));
              const byStatus = ["new", "contacted", "qualified", "quoted", "won", "lost"].map((s) => ({
                name: s.charAt(0).toUpperCase() + s.slice(1),
                value: mockLeads.filter((l) => l.status === s).length,
              }));
              return (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Total Leads" value={totalLeads.toString()} icon={Users} />
                    <StatCard title="Won" value={won.toString()} icon={TrendingUp} variant="success" />
                    <StatCard title="Lost" value={lost.toString()} icon={TrendingDown} variant="danger" />
                    <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} trend={parseFloat(conversionRate) > 30 ? 5 : -2} variant={parseFloat(conversionRate) > 30 ? "success" : "danger"} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader><CardTitle className="text-base">Leads by Status</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie data={byStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Conversion by Source</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={bySource}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip />
                            <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4,4,0,0]} />
                            <Bar dataKey="won" name="Won" fill="#10b981" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* ═══ QUOTATIONS TAB ═══ */}
          <TabsContent value="quotations" className="space-y-4">
            {(() => {
              const totalQ = mockQuotations.length;
              const approved = mockQuotations.filter((q) => q.status === "approved").length;
              const totalValue = mockQuotations.reduce((s, q) => s + q.amount, 0);
              const approvedValue = mockQuotations.filter((q) => q.status === "approved").reduce((s, q) => s + q.amount, 0);
              const convRate = totalQ > 0 ? ((approved / totalQ) * 100).toFixed(1) : "0";
              const byStatus = ["draft", "sent", "approved", "rejected", "expired"].map((s) => ({
                name: s.charAt(0).toUpperCase() + s.slice(1),
                count: mockQuotations.filter((q) => q.status === s).length,
                value: mockQuotations.filter((q) => q.status === s).reduce((sum, q) => sum + q.amount, 0),
              }));
              return (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Total Quotations" value={totalQ.toString()} icon={DollarSign} />
                    <StatCard title="Approved" value={approved.toString()} icon={TrendingUp} variant="success" />
                    <StatCard title="Total Value" value={`৳${totalValue.toLocaleString()}`} icon={DollarSign} />
                    <StatCard title="Conversion Rate" value={`${convRate}%`} icon={TrendingUp} trend={parseFloat(convRate) > 40 ? 8 : -3} variant={parseFloat(convRate) > 40 ? "success" : "danger"} />
                  </div>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Quotation Status Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Total Value</TableHead><TableHead className="text-right">% of Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {byStatus.map((s) => (
                            <TableRow key={s.name}>
                              <TableCell><Badge variant="secondary" className="capitalize">{s.name}</Badge></TableCell>
                              <TableCell className="text-right">{s.count}</TableCell>
                              <TableCell className="text-right font-semibold">৳{s.value.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{totalValue > 0 ? ((s.value/totalValue)*100).toFixed(1) : 0}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>

          {/* ═══ EXPENSE TAB ═══ */}
          <TabsContent value="expense" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Total Expenses" value={`৳${expenseData.totalExpenses.toLocaleString()}`} icon={TrendingDown} variant="danger" />
              <StatCard title="Vendor Costs" value={`৳${expenseData.vendorCosts.toLocaleString()}`} icon={DollarSign} />
              <StatCard title="Combined Outflow" value={`৳${(expenseData.totalExpenses + expenseData.vendorCosts).toLocaleString()}`} icon={TrendingDown} trend={-5} variant="danger" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Monthly Expenses */}
              <Card>
                <CardHeader><CardTitle className="text-base">Monthly Expenses</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={expenseData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, "Expense"]} />
                      <Bar dataKey="amount" fill="hsl(var(--destructive, 0 84% 60%))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Expenses by Category */}
              <Card>
                <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={expenseData.byCategoryArr} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {expenseData.byCategoryArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Expense Table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Expense Details</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{e.date}</TableCell>
                        <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{e.vendorName}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">৳{e.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PROFIT TAB ═══ */}
          <TabsContent value="profit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard title="Total Income" value={`৳${profitData.totalIncome.toLocaleString()}`} icon={TrendingUp} variant="success" />
              <StatCard title="Booking Cost" value={`৳${profitData.totalCost.toLocaleString()}`} icon={DollarSign} />
              <StatCard title="Gross Profit" value={`৳${profitData.grossProfit.toLocaleString()}`} icon={TrendingUp} trend={15} variant="success" />
              <StatCard title="Net Profit" value={`৳${profitData.netProfit.toLocaleString()}`} icon={DollarSign} trend={profitData.netProfit >= 0 ? 10 : -10} variant={profitData.netProfit >= 0 ? "success" : "danger"} />
            </div>

            {/* Income vs Expense Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Income vs Cost vs Expense (Monthly)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={profitData.comparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit Line */}
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Profit Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={profitData.comparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Per-Booking Profit Table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Per-Booking Profit</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitData.bookingProfits.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-sm">{b.date}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{b.type}</Badge></TableCell>
                        <TableCell className="font-medium">{b.clientName}</TableCell>
                        <TableCell className="text-right">৳{b.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">৳{b.cost.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-semibold ${b.profit >= 0 ? "text-green-600" : "text-destructive"}`}>৳{b.profit.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{b.margin}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ DUE PAYMENTS TAB ═══ */}
          <TabsContent value="due" className="space-y-4">
            {(() => {
              const totalDue = mockDuePayments.reduce((s, p) => s + p.due, 0);
              const overdue = mockDuePayments.filter((p) => p.status === "overdue");
              const totalOverdue = overdue.reduce((s, p) => s + p.due, 0);
              return (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Outstanding" value={`৳${totalDue.toLocaleString()}`} icon={DollarSign} variant="danger" />
                    <StatCard title="Overdue Amount" value={`৳${totalOverdue.toLocaleString()}`} icon={TrendingDown} variant="danger" />
                    <StatCard title="Overdue Invoices" value={overdue.length.toString()} icon={Users} variant="danger" />
                  </div>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Outstanding Payments</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Client</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {mockDuePayments.map((p) => (
                            <TableRow key={p.invoiceId}>
                              <TableCell className="font-mono text-sm">{p.invoiceId}</TableCell>
                              <TableCell className="font-medium">{p.clientName}</TableCell>
                              <TableCell className="text-right">৳{p.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-green-600">৳{p.paid.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-semibold text-destructive">৳{p.due.toLocaleString()}</TableCell>
                              <TableCell className="text-muted-foreground">{p.dueDate}</TableCell>
                              <TableCell>
                                <Badge variant={p.status === "overdue" ? "destructive" : "secondary"}>{p.status === "overdue" ? "Overdue" : "Upcoming"}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>

          {/* ═══ STAFF PERFORMANCE TAB ═══ */}
          <TabsContent value="staff" className="space-y-4">
            {(() => {
              const staffPerf = agents.map((a) => {
                const agentBookings = mockBookings.filter((b) => b.agentId === a.id);
                const agentLeads = mockLeads.filter((l) => l.assignedTo === a.name);
                const wonLeads = agentLeads.filter((l) => l.status === "won").length;
                return {
                  name: a.name,
                  bookings: agentBookings.length,
                  revenue: agentBookings.reduce((s, b) => s + b.amount, 0),
                  profit: agentBookings.reduce((s, b) => s + b.profit, 0),
                  totalLeads: agentLeads.length,
                  wonLeads,
                  conversionRate: agentLeads.length > 0 ? ((wonLeads / agentLeads.length) * 100).toFixed(1) : "0",
                };
              });
              return (
                <>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader><CardTitle className="text-base">Staff Revenue Comparison</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={staffPerf}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                            <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                            <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Staff Performance Details</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead className="text-right">Bookings</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Conversion</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {staffPerf.map((s) => (
                              <TableRow key={s.name}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell className="text-right">{s.bookings}</TableCell>
                                <TableCell className="text-right font-semibold">৳{s.revenue.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{s.totalLeads} ({s.wonLeads} won)</TableCell>
                                <TableCell className="text-right"><Badge variant={parseFloat(s.conversionRate) > 40 ? "default" : "secondary"}>{s.conversionRate}%</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* ═══ COMMISSION TAB ═══ */}
          <TabsContent value="commission" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Total Commission" value={`৳${commissionData.totalCommission.toLocaleString()}`} icon={Users} />
              <StatCard title="Paid Commission" value={`৳${commissionData.totalPaid.toLocaleString()}`} icon={DollarSign} variant="success" />
              <StatCard title="Due Commission" value={`৳${commissionData.totalDue.toLocaleString()}`} icon={TrendingDown} variant="danger" />
            </div>

            {/* Commission Bar Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Agent Commission Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={commissionData.agents} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="agentName" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="paidCommission" name="Paid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="dueCommission" name="Due" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Commission Table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Agent Commission Details</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-center">Rate</TableHead>
                      <TableHead className="text-center">Bookings</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionData.agents.map((a) => (
                      <TableRow key={a.agentId}>
                        <TableCell className="font-medium">{a.agentName}</TableCell>
                        <TableCell className="text-right">৳{a.totalSales.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{a.commissionRate}%</TableCell>
                        <TableCell className="text-center">{a.bookingsCount}</TableCell>
                        <TableCell className="text-right font-semibold">৳{a.totalCommission.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600">৳{a.paidCommission.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">৳{a.dueCommission.toLocaleString()}</TableCell>
                        <TableCell>
                          {a.dueCommission === 0 ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Fully Paid</Badge>
                          ) : (
                            <Badge variant="destructive">Due</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
