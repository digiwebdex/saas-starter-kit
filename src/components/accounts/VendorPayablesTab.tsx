import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import { useNavigate } from "react-router-dom";
import type { VendorBill, VendorBillStatus } from "@/lib/api";

const STATUS_META: Record<VendorBillStatus, { label: string; color: string }> = {
  unpaid: { label: "Unpaid", color: "bg-yellow-100 text-yellow-800" },
  partial: { label: "Partially Paid", color: "bg-blue-100 text-blue-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800" },
};

interface Props {
  bills: VendorBill[];
}

export default function VendorPayablesTab({ bills }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("outstanding");

  const filtered = useMemo(() => {
    let list = bills;
    if (statusFilter === "outstanding") {
      list = list.filter((b) => ["unpaid", "partial", "overdue"].includes(b.status));
    } else if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        (b.vendorName || "").toLowerCase().includes(q) ||
        (b.description || "").toLowerCase().includes(q) ||
        (b.bookingTitle || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [bills, search, statusFilter]);

  const totals = useMemo(() => ({
    total: filtered.reduce((s, b) => s + b.totalAmount, 0),
    paid: filtered.reduce((s, b) => s + b.paidAmount, 0),
    due: filtered.reduce((s, b) => s + b.dueAmount, 0),
  }), [filtered]);

  const handleExport = () => {
    const csv = [
      "Vendor,Booking,Description,Total,Paid,Due,Status,Due Date",
      ...filtered.map((b) =>
        `${b.vendorName || ""},${b.bookingTitle || ""},${b.description},${b.totalAmount},${b.paidAmount},${b.dueAmount},${b.status},${b.dueDate || ""}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vendor-payables.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search vendor, booking, or description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="outstanding">Outstanding</SelectItem>
              <SelectItem value="all">All Bills</SelectItem>
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

      <div className="grid gap-3 grid-cols-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Bills</p><p className="text-lg font-bold">৳{totals.total.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Paid to Vendors</p><p className="text-lg font-bold text-green-600">৳{totals.paid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-lg font-bold text-orange-600">৳{totals.due.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No vendor payables found</TableCell></TableRow>
              ) : (
                filtered.map((bill) => {
                  const meta = STATUS_META[bill.status];
                  return (
                    <TableRow key={bill.id} className="cursor-pointer hover:bg-muted/50" onClick={() => bill.vendorId && navigate(`/vendors/${bill.vendorId}`)}>
                      <TableCell className="font-medium">{bill.vendorName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{bill.bookingTitle || "—"}</TableCell>
                      <TableCell>{bill.description}</TableCell>
                      <TableCell className="text-right">৳{bill.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">৳{bill.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">৳{bill.dueAmount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="secondary" className={meta.color}>{meta.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{bill.dueDate || "—"}</TableCell>
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
