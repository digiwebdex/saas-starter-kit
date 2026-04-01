import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Store } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import PermissionGate from "@/components/PermissionGate";
import type { VendorBill } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-800", partial: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-800",
};

interface Props { bills: VendorBill[]; }

export default function VendorReport({ bills }: Props) {
  const data = useMemo(() => {
    const totalPayable = bills.reduce((s, b) => s + b.totalAmount, 0);
    const totalPaid = bills.reduce((s, b) => s + b.paidAmount, 0);
    const totalDue = bills.reduce((s, b) => s + b.dueAmount, 0);
    const overdue = bills.filter((b) => b.status === "overdue");
    const overdueAmount = overdue.reduce((s, b) => s + b.dueAmount, 0);

    // By vendor
    const byVendor: Record<string, { total: number; paid: number; due: number }> = {};
    bills.forEach((b) => {
      const v = b.vendorName || "Unknown";
      if (!byVendor[v]) byVendor[v] = { total: 0, paid: 0, due: 0 };
      byVendor[v].total += b.totalAmount;
      byVendor[v].paid += b.paidAmount;
      byVendor[v].due += b.dueAmount;
    });
    const byVendorArr = Object.entries(byVendor)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([name, v]) => ({ name, ...v }));

    return { totalPayable, totalPaid, totalDue, overdueAmount, overdueCount: overdue.length, byVendorArr };
  }, [bills]);

  const exportCsv = () => {
    const csv = ["Vendor,Booking,Description,Total,Paid,Due,Status,Due Date",
      ...bills.map((b) => `${b.vendorName || ""},${b.bookingTitle || ""},${b.description.replace(/,/g, ";")},${b.totalAmount},${b.paidAmount},${b.dueAmount},${b.status},${b.dueDate || ""}`)
    ].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "vendor-report.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="grid gap-4 md:grid-cols-4 flex-1 mr-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Vendor Bills</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">৳{data.totalPayable.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Paid to Vendors</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">৳{data.totalPaid.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-orange-600">৳{data.totalDue.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overdue ({data.overdueCount})</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">৳{data.overdueAmount.toLocaleString()}</p></CardContent></Card>
        </div>
        <PermissionGate module="reports" action="export">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Payables by Vendor</CardTitle></CardHeader>
        <CardContent>
          {data.byVendorArr.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byVendorArr}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                <Bar dataKey="paid" name="Paid" fill="#10b981" stackId="a" />
                <Bar dataKey="due" name="Outstanding" fill="#f59e0b" stackId="a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12">No vendor bill data</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vendor Payable Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No vendor bills recorded</TableCell></TableRow>
              ) : bills.slice(0, 20).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.vendorName || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{b.description}</TableCell>
                  <TableCell className="text-right">৳{b.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">৳{b.paidAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold text-orange-600">৳{b.dueAmount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className={STATUS_COLORS[b.status] || ""}>{b.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{b.dueDate || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
