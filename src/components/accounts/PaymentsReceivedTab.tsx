import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Download, ArrowUpCircle } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import type { Payment } from "@/lib/api";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", bank: "Bank Transfer", card: "Card", mobile_banking: "Mobile Banking", cheque: "Cheque", online: "Online",
};

interface Props {
  payments: Payment[];
}

export default function PaymentsReceivedTab({ payments }: Props) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = payments;
    if (methodFilter !== "all") list = list.filter((p) => p.method === methodFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        (p.transactionRef || "").toLowerCase().includes(q) ||
        (p.notes || "").toLowerCase().includes(q) ||
        (p.receivedByName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, search, methodFilter]);

  const total = useMemo(() => filtered.reduce((s, p) => s + p.amount, 0), [filtered]);

  const handleExport = () => {
    const csv = [
      "Date,Amount,Method,Reference,Received By,Notes",
      ...filtered.map((p) =>
        `${p.date},${p.amount},${p.method},${p.transactionRef || ""},${p.receivedByName || ""},${(p.notes || "").replace(/,/g, ";")}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "payments-received.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by reference or notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">Total: <span className="text-green-600 font-bold">৳{total.toLocaleString()}</span></div>
          <PermissionGate module="accounts" action="export">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payments recorded yet</TableCell></TableRow>
              ) : (
                [...filtered].reverse().map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.date}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowUpCircle className="h-3.5 w-3.5" />৳{p.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{METHOD_LABELS[p.method] || p.method}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{p.transactionRef || "—"}</TableCell>
                    <TableCell>{p.receivedByName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
