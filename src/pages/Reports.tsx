import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { RefreshCw, Filter, Calendar, BarChart3, DollarSign, Store, Users, TrendingUp, Target } from "lucide-react";
import { format, isWithinInterval, parseISO, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import FeatureGate from "@/components/FeatureGate";
import SalesReport from "@/components/reports/SalesReport";
import LeadsQuotationReport from "@/components/reports/LeadsQuotationReport";
import PaymentReport from "@/components/reports/PaymentReport";
import VendorReport from "@/components/reports/VendorReport";
import StaffPerformanceReport from "@/components/reports/StaffPerformanceReport";
import ProfitabilityReport from "@/components/reports/ProfitabilityReport";
import {
  leadApi, bookingApi, invoiceApi, paymentApi, vendorApi, quotationApi, expenseApi, tenantApi,
} from "@/lib/api";
import type { Lead, Booking, Invoice, Payment, VendorBill, Quotation, Expense, User } from "@/lib/api";

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

const Reports = () => {
  const { currentPlan } = useAuth();
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subMonths(new Date(), 3));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Raw data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsR, bookingsR, invoicesR, paymentsR, billsR, quotationsR, expensesR, teamR] = await Promise.allSettled([
        leadApi.list(), bookingApi.list(), invoiceApi.list(), paymentApi.list(),
        vendorApi.getPayableReport(), quotationApi.list(), expenseApi.list(), tenantApi.getMembers(),
      ]);
      if (leadsR.status === "fulfilled") setLeads(leadsR.value);
      if (bookingsR.status === "fulfilled") setBookings(bookingsR.value);
      if (invoicesR.status === "fulfilled") setInvoices(invoicesR.value);
      if (paymentsR.status === "fulfilled") setPayments(paymentsR.value);
      if (billsR.status === "fulfilled") setVendorBills(billsR.value);
      if (quotationsR.status === "fulfilled") setQuotations(quotationsR.value);
      if (expensesR.status === "fulfilled") setExpenses(expensesR.value);
      if (teamR.status === "fulfilled") setTeamMembers(teamR.value);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter helper
  const inDateRange = (dateStr: string | undefined) => {
    if (!dateStr || !dateFrom || !dateTo) return true;
    try { return isWithinInterval(parseISO(dateStr), { start: dateFrom, end: dateTo }); } catch { return true; }
  };

  // Filtered data
  const filteredBookings = bookings.filter((b) => {
    if (!inDateRange(b.createdAt)) return false;
    if (filterAgent !== "all" && b.assignedTo !== filterAgent && b.agentId !== filterAgent) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    return true;
  });

  const filteredLeads = leads.filter((l) => {
    if (!inDateRange(l.createdAt)) return false;
    if (filterAgent !== "all" && l.assignedTo !== filterAgent) return false;
    return true;
  });

  const filteredInvoices = invoices.filter((i) => inDateRange(i.issuedDate || i.createdAt));
  const filteredPayments = payments.filter((p) => inDateRange(p.date));
  const filteredQuotations = quotations.filter((q) => inDateRange(q.createdAt));
  const filteredExpenses = expenses.filter((e) => inDateRange(e.date));

  // Unique agents/staff from data
  const agentOptions = Array.from(new Map([
    ...leads.filter((l) => l.assignedTo).map((l) => [l.assignedTo!, l.assignedToName || "Unknown"]),
    ...bookings.filter((b) => b.assignedTo).map((b) => [b.assignedTo!, b.assignedToName || "Unknown"]),
    ...bookings.filter((b) => b.agentId).map((b) => [b.agentId, b.agentName || "Unknown"]),
  ] as [string, string][]).values());

  const resetFilters = () => {
    setDateFrom(subMonths(new Date(), 3));
    setDateTo(new Date());
    setFilterAgent("all");
    setFilterStatus("all");
  };

  return (
    <DashboardLayout>
      <FeatureGate
        featureId="advanced_analytics"
        currentPlan={currentPlan}
        fallback={
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Advanced Reports & Analytics</h2>
            <p className="text-muted-foreground max-w-md mb-2">
              Gain deep insights into your agency's sales, payments, vendors, staff performance, and profitability.
            </p>
            <ul className="text-sm text-muted-foreground mb-6 space-y-1 text-left">
              <li>• Sales and booking analytics with charts</li>
              <li>• Lead-to-booking conversion tracking</li>
              <li>• Payment collection vs outstanding reports</li>
              <li>• Vendor payable summaries</li>
              <li>• Staff performance comparison</li>
              <li>• Booking-level profitability margins</li>
              <li>• Export all reports to CSV</li>
            </ul>
            <Button onClick={() => window.location.href = "/subscription"}>
              Upgrade to Business Plan
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
              <p className="text-muted-foreground">Sales, leads, payments, vendors, staff, and profitability insights</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
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
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Staff" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {agentOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="ticketed">Ticketed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
              <TabsTrigger value="sales" className="text-xs"><DollarSign className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Sales</TabsTrigger>
              <TabsTrigger value="leads" className="text-xs"><Target className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Leads & Quotes</TabsTrigger>
              <TabsTrigger value="payments" className="text-xs"><TrendingUp className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Payments</TabsTrigger>
              <TabsTrigger value="vendors" className="text-xs"><Store className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Vendors</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs"><Users className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Staff</TabsTrigger>
              <TabsTrigger value="profitability" className="text-xs"><BarChart3 className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Profitability</TabsTrigger>
            </TabsList>

            <TabsContent value="sales"><SalesReport bookings={filteredBookings} /></TabsContent>
            <TabsContent value="leads"><LeadsQuotationReport leads={filteredLeads} quotations={filteredQuotations} /></TabsContent>
            <TabsContent value="payments"><PaymentReport invoices={filteredInvoices} payments={filteredPayments} /></TabsContent>
            <TabsContent value="vendors"><VendorReport bills={vendorBills} /></TabsContent>
            <TabsContent value="staff"><StaffPerformanceReport leads={filteredLeads} bookings={filteredBookings} quotations={filteredQuotations} teamMembers={teamMembers.map((m) => ({ id: m.id, name: m.name }))} /></TabsContent>
            <TabsContent value="profitability"><ProfitabilityReport bookings={filteredBookings} invoices={filteredInvoices} vendorBills={vendorBills} expenses={filteredExpenses} /></TabsContent>
          </Tabs>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default Reports;
