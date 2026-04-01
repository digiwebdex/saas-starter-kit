import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Download, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import type { Transaction } from "@/lib/api";

const TYPE_META: Record<string, { label: string; color: string; icon: typeof ArrowUpCircle }> = {
  income: { label: "Income", color: "text-green-600", icon: ArrowUpCircle },
  expense: { label: "Expense", color: "text-destructive", icon: ArrowDownCircle },
  refund: { label: "Refund", color: "text-purple-600", icon: RefreshCw },
  vendor_payment: { label: "Vendor Payment", color: "text-orange-600", icon: ArrowDownCircle },
};

interface Props {
  transactions: Transaction[];
}

export default function LedgerTab({ transactions }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let list = transactions;
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.description.toLowerCase().includes(q) ||
        (t.clientName || "").toLowerCase().includes(q) ||
        (t.vendorName || "").toLowerCase().includes(q) ||
        (t.bookingTitle || "").toLowerCase().includes(q) ||
        (t.invoiceNumber || "").toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, search, typeFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const inc = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = filtered.filter((t) => t.type !== "income").reduce((s, t) => s + t.amount, 0);
    return { income: inc, outgoing: exp, net: inc - exp };
  }, [filtered]);

  const handleExport = () => {
    const csv = [
      "Date,Type,Category,Description,Amount,Client,Vendor,Booking,Invoice,Method,Reference",
      ...filtered.map((t) =>
        `${t.date},${t.type},${t.category},${t.description.replace(/,/g, ";")},${t.amount},${t.clientName || ""},${t.vendorName || ""},${t.bookingTitle || ""},${t.invoiceNumber || ""},${t.paymentMethod || ""},${t.referenceId || ""}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ledger.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search ledger..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="vendor_payment">Vendor Payment</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" placeholder="From" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" placeholder="To" />
          <PermissionGate module="accounts" action="export">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          </PermissionGate>
        </div>

        <div className="grid gap-3 grid-cols-3">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Income</p><p className="text-lg font-bold text-green-600">৳{totals.income.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Outgoing</p><p className="text-lg font-bold text-destructive">৳{totals.outgoing.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Net</p><p className={`text-lg font-bold ${totals.net >= 0 ? "text-green-600" : "text-destructive"}`}>৳{totals.net.toLocaleString()}</p></CardContent></Card>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Client / Vendor</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No transactions in the ledger</TableCell></TableRow>
              ) : (
                [...filtered].reverse().map((tx) => {
                  const meta = TYPE_META[tx.type] || TYPE_META.expense;
                  const Icon = meta.icon;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" /><span className="text-sm">{meta.label}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{tx.category}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.description}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.clientName || tx.vendorName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.bookingTitle || "—"}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{(tx.paymentMethod || "").replace("_", " ") || "—"}</TableCell>
                      <TableCell className={`text-right font-semibold ${meta.color}`}>
                        {tx.type === "income" ? "+" : "−"}৳{tx.amount.toLocaleString()}
                      </TableCell>
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
