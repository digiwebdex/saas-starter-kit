import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import PermissionGate from "@/components/PermissionGate";
import { useNavigate } from "react-router-dom";
import type { Booking, Invoice, VendorBill, Expense } from "@/lib/api";

interface Props {
  bookings: Booking[];
  invoices: Invoice[];
  vendorBills: VendorBill[];
  expenses: Expense[];
}

export default function ProfitabilityReport({ bookings, invoices, vendorBills, expenses }: Props) {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const totalRevenue = bookings.reduce((s, b) => s + b.amount, 0);
    const totalCost = bookings.reduce((s, b) => s + (b.cost || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;
    const margin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0";

    // Per-booking profit
    const bookingProfits = bookings
      .filter((b) => b.amount > 0)
      .map((b) => ({
        id: b.id,
        title: b.title || b.clientName || "Booking",
        clientName: b.clientName || "—",
        type: b.type,
        amount: b.amount,
        cost: b.cost || 0,
        profit: b.profit || (b.amount - (b.cost || 0)),
        margin: b.amount > 0 ? (((b.profit || (b.amount - (b.cost || 0))) / b.amount) * 100).toFixed(1) : "0",
        status: b.status,
      }))
      .sort((a, b) => b.profit - a.profit);

    // Monthly P&L
    const months: Record<string, { revenue: number; cost: number; expense: number }> = {};
    bookings.forEach((b) => {
      try {
        const m = format(parseISO(b.createdAt || b.travelDateFrom || ""), "MMM yyyy");
        if (!months[m]) months[m] = { revenue: 0, cost: 0, expense: 0 };
        months[m].revenue += b.amount;
        months[m].cost += b.cost || 0;
      } catch {}
    });
    expenses.forEach((e) => {
      try {
        const m = format(parseISO(e.date), "MMM yyyy");
        if (!months[m]) months[m] = { revenue: 0, cost: 0, expense: 0 };
        months[m].expense += e.amount;
      } catch {}
    });
    const monthlyPL = Object.entries(months).map(([month, v]) => ({
      month, revenue: v.revenue, costs: v.cost + v.expense, profit: v.revenue - v.cost - v.expense,
    }));

    return { totalRevenue, totalCost, totalExpenses, grossProfit, netProfit, margin, bookingProfits, monthlyPL };
  }, [bookings, expenses]);

  const exportCsv = () => {
    const csv = ["Booking,Client,Type,Revenue,Cost,Profit,Margin %,Status",
      ...data.bookingProfits.map((b) => `${b.title},${b.clientName},${b.type},${b.amount},${b.cost},${b.profit},${b.margin}%,${b.status}`)
    ].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "profitability-report.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="grid gap-4 md:grid-cols-5 flex-1 mr-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">৳{data.totalRevenue.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Vendor Costs</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-orange-600">৳{data.totalCost.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Expenses</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-muted-foreground">৳{data.totalExpenses.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Gross Profit</CardTitle></CardHeader><CardContent><p className={`text-xl font-bold ${data.grossProfit >= 0 ? "text-green-600" : "text-destructive"}`}>৳{data.grossProfit.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margin</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{data.margin}%</p></CardContent></Card>
        </div>
        <PermissionGate module="reports" action="export">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Revenue vs Costs</CardTitle></CardHeader>
        <CardContent>
          {data.monthlyPL.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyPL}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                <Bar dataKey="costs" name="Total Costs" fill="#f59e0b" radius={[4,4,0,0]} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12">No financial data for this period</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Booking Profitability</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead><TableHead>Client</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead><TableHead className="text-right">Margin</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bookingProfits.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No booking profitability data. Add vendor costs to bookings to see margins.</TableCell></TableRow>
              ) : data.bookingProfits.slice(0, 25).map((b) => (
                <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/bookings/${b.id}`)}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.clientName}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{b.type}</Badge></TableCell>
                  <TableCell className="text-right">৳{b.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-orange-600">৳{b.cost.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-semibold ${b.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                    <div className="flex items-center justify-end gap-1">
                      {b.profit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      ৳{b.profit.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{b.margin}%</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{b.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
