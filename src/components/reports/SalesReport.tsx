import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, Plane, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import PermissionGate from "@/components/PermissionGate";
import type { Booking } from "@/lib/api";

const PIE_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800", ticketed: "bg-indigo-100 text-indigo-800",
  traveling: "bg-cyan-100 text-cyan-800", cancelled: "bg-red-100 text-red-800",
};

interface Props { bookings: Booking[]; }

export default function SalesReport({ bookings }: Props) {
  const data = useMemo(() => {
    const totalSales = bookings.reduce((s, b) => s + b.amount, 0);
    const avgValue = bookings.length > 0 ? Math.round(totalSales / bookings.length) : 0;

    // By type
    const byType: Record<string, number> = {};
    bookings.forEach((b) => { byType[b.type] = (byType[b.type] || 0) + b.amount; });
    const byTypeArr = Object.entries(byType).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    // By destination
    const byDest: Record<string, number> = {};
    bookings.forEach((b) => { if (b.destination) byDest[b.destination] = (byDest[b.destination] || 0) + 1; });
    const byDestArr = Object.entries(byDest).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

    // Monthly trend
    const byMonth: Record<string, number> = {};
    bookings.forEach((b) => {
      try { const m = format(parseISO(b.createdAt || b.travelDateFrom || ""), "MMM yyyy"); byMonth[m] = (byMonth[m] || 0) + b.amount; } catch {}
    });
    const monthlyTrend = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));

    // By status
    const byStatus: Record<string, number> = {};
    bookings.forEach((b) => { byStatus[b.status] = (byStatus[b.status] || 0) + 1; });
    const byStatusArr = Object.entries(byStatus).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    return { totalSales, avgValue, byTypeArr, byDestArr, monthlyTrend, byStatusArr };
  }, [bookings]);

  const exportCsv = () => {
    const csv = ["Date,Type,Client,Destination,Amount,Status",
      ...bookings.map((b) => `${b.createdAt || ""},${b.type},${(b.clientName || "").replace(/,/g, ";")},${b.destination || ""},${b.amount},${b.status}`)
    ].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sales-report.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="grid gap-4 md:grid-cols-3 flex-1 mr-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" />Total Sales</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">৳{data.totalSales.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5"><Plane className="h-4 w-4" />Total Bookings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{bookings.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />Avg Booking Value</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">৳{data.avgValue.toLocaleString()}</p></CardContent></Card>
        </div>
        <PermissionGate module="reports" action="export">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
        </PermissionGate>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            {data.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No booking data for this period</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Sales by Package Type</CardTitle></CardHeader>
          <CardContent>
            {data.byTypeArr.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.byTypeArr} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.byTypeArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data available</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            {data.byStatusArr.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.byStatusArr} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                    {data.byStatusArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data available</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Destinations</CardTitle></CardHeader>
          <CardContent>
            {data.byDestArr.length > 0 ? (
              <div className="space-y-3">
                {data.byDestArr.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-6 text-muted-foreground">{i + 1}.</span>
                    <span className="text-sm flex-1">{d.name}</span>
                    <div className="w-32 bg-muted rounded-full h-2"><div className="h-2 rounded-full bg-primary" style={{ width: `${(d.value / (data.byDestArr[0]?.value || 1)) * 100}%` }} /></div>
                    <span className="text-sm font-semibold w-8 text-right">{d.value}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-muted-foreground py-12">No destination data</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Booking Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead><TableHead>Type</TableHead><TableHead>Destination</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No bookings in this period</TableCell></TableRow>
              ) : bookings.slice(0, 20).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.clientName || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{b.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{b.destination || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">৳{b.amount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className={STATUS_COLORS[b.status] || ""}>{b.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
