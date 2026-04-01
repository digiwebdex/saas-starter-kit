import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import PermissionGate from "@/components/PermissionGate";
import type { Invoice, Payment } from "@/lib/api";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", bank: "Bank Transfer", card: "Card", mobile_banking: "Mobile Banking", cheque: "Cheque", online: "Online",
};

interface Props { invoices: Invoice[]; payments: Payment[]; }

export default function PaymentReport({ invoices, payments }: Props) {
  const data = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalDue = invoices.reduce((s, i) => s + i.dueAmount, 0);
    const overdue = invoices.filter((i) => i.status === "overdue");
    const overdueAmount = overdue.reduce((s, i) => s + i.dueAmount, 0);

    // Collection by method
    const byMethod: Record<string, number> = {};
    payments.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });
    const byMethodArr = Object.entries(byMethod).map(([name, value]) => ({ name: METHOD_LABELS[name] || name, value }));

    // Monthly collected vs due
    const months: Record<string, { collected: number; invoiced: number }> = {};
    invoices.forEach((inv) => {
      try {
        const m = format(parseISO(inv.issuedDate || inv.createdAt), "MMM yyyy");
        if (!months[m]) months[m] = { collected: 0, invoiced: 0 };
        months[m].invoiced += inv.totalAmount;
        months[m].collected += inv.paidAmount;
      } catch {}
    });
    const monthlyArr = Object.entries(months).map(([month, v]) => ({ month, ...v, due: v.invoiced - v.collected }));

    return { totalInvoiced, totalCollected, totalDue, overdueAmount, overdueCount: overdue.length, byMethodArr, monthlyArr };
  }, [invoices, payments]);

  const exportCsv = () => {
    const csv = ["Invoice #,Client,Total,Paid,Due,Status,Due Date",
      ...invoices.map((i) => `${i.invoiceNumber || ""},${i.clientName || ""},${i.totalAmount},${i.paidAmount},${i.dueAmount},${i.status},${i.dueDate || ""}`)
    ].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "payment-report.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="grid gap-4 md:grid-cols-4 flex-1 mr-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" />Total Invoiced</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">৳{data.totalInvoiced.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-green-600" />Collected</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">৳{data.totalCollected.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-orange-600">৳{data.totalDue.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-destructive" />Overdue ({data.overdueCount})</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">৳{data.overdueAmount.toLocaleString()}</p></CardContent></Card>
        </div>
        <PermissionGate module="reports" action="export">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
        </PermissionGate>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Collected vs Outstanding (Monthly)</CardTitle></CardHeader>
          <CardContent>
            {data.monthlyArr.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.monthlyArr}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="due" name="Outstanding" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No payment data for this period</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Collection by Method</CardTitle></CardHeader>
          <CardContent>
            {data.byMethodArr.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byMethodArr} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={120} />
                  <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                  <Bar dataKey="value" name="Amount" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No payment method data</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Overdue Invoices</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Client</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoices.filter((i) => i.status === "overdue" || (i.dueDate && i.dueDate < new Date().toISOString().split("T")[0] && i.dueAmount > 0)).length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No overdue invoices — great job!</TableCell></TableRow>
              ) : invoices.filter((i) => i.status === "overdue" || (i.dueDate && i.dueDate < new Date().toISOString().split("T")[0] && i.dueAmount > 0)).map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.invoiceNumber || i.id.slice(0, 8)}</TableCell>
                  <TableCell>{i.clientName || "—"}</TableCell>
                  <TableCell className="text-right">৳{i.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">৳{i.paidAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">৳{i.dueAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">{i.dueDate || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
