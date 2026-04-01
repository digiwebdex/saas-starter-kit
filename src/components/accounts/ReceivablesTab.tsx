import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import { useNavigate } from "react-router-dom";
import type { Invoice, InvoiceStatus } from "@/lib/api";

const STATUS_META: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Unpaid", color: "bg-yellow-100 text-yellow-800" },
  partial: { label: "Partially Paid", color: "bg-blue-100 text-blue-800" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  refunded: { label: "Refunded", color: "bg-purple-100 text-purple-800" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
};

interface Props {
  invoices: Invoice[];
}

export default function ReceivablesTab({ invoices }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("receivable");

  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter === "receivable") {
      list = list.filter((i) => ["unpaid", "partial", "overdue"].includes(i.status));
    } else if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        (i.invoiceNumber || "").toLowerCase().includes(q) ||
        (i.clientName || "").toLowerCase().includes(q) ||
        (i.bookingTitle || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, search, statusFilter]);

  const totals = useMemo(() => ({
    total: filtered.reduce((s, i) => s + i.totalAmount, 0),
    paid: filtered.reduce((s, i) => s + i.paidAmount, 0),
    due: filtered.reduce((s, i) => s + i.dueAmount, 0),
  }), [filtered]);

  const handleExport = () => {
    const csv = [
      "Invoice #,Client,Booking,Total,Paid,Due,Status,Due Date",
      ...filtered.map((i) =>
        `${i.invoiceNumber || ""},${i.clientName || ""},${i.bookingTitle || ""},${i.totalAmount},${i.paidAmount},${i.dueAmount},${i.status},${i.dueDate || ""}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "receivables.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by invoice, client, or booking..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="receivable">Outstanding</SelectItem>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partially Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate module="accounts" action="export">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
        </PermissionGate>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Amount</p><p className="text-lg font-bold">৳{totals.total.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Collected</p><p className="text-lg font-bold text-green-600">৳{totals.paid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-lg font-bold text-destructive">৳{totals.due.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No receivable invoices found</TableCell></TableRow>
              ) : (
                filtered.map((inv) => {
                  const meta = STATUS_META[inv.status] || STATUS_META.unpaid;
                  return (
                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices`)}>
                      <TableCell className="font-medium">{inv.invoiceNumber || inv.id.slice(0, 8)}</TableCell>
                      <TableCell>{inv.clientName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.bookingTitle || "—"}</TableCell>
                      <TableCell className="text-right">৳{inv.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">৳{inv.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">৳{inv.dueAmount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="secondary" className={meta.color}>{meta.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{inv.dueDate || "—"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
