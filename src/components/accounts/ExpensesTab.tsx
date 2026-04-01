import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Search, Download, Plus, ArrowDownCircle } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { useToast } from "@/hooks/use-toast";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/lib/api";
import { expenseApi } from "@/lib/api";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "office", label: "Office" },
  { value: "travel", label: "Travel" },
  { value: "salary", label: "Salary" },
  { value: "marketing", label: "Marketing" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "insurance", label: "Insurance" },
  { value: "supplies", label: "Supplies" },
  { value: "commission", label: "Commission" },
  { value: "bank_charges", label: "Bank Charges" },
  { value: "taxes", label: "Taxes" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "cheque", label: "Cheque" },
];

interface Props {
  expenses: Expense[];
  onRefresh: () => void;
}

const emptyForm = {
  category: "office" as ExpenseCategory,
  description: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  paymentMethod: "cash" as PaymentMethod,
  reference: "",
  notes: "",
};

export default function ExpensesTab({ expenses, onRefresh }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = expenses;
    if (catFilter !== "all") list = list.filter((e) => e.category === catFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q) || (e.notes || "").toLowerCase().includes(q));
    }
    return list;
  }, [expenses, search, catFilter]);

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) return;
    setSaving(true);
    try {
      await expenseApi.create(form as any);
      toast({ title: "Expense recorded" });
      setForm(emptyForm);
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const csv = [
      "Date,Category,Description,Amount,Method,Reference,Notes",
      ...filtered.map((e) =>
        `${e.date},${e.category},${e.description.replace(/,/g, ";")},${e.amount},${e.paymentMethod},${e.reference || ""},${(e.notes || "").replace(/,/g, ";")}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expenses.csv";
    a.click();
  };

  const getCatLabel = (c: string) => CATEGORIES.find((x) => x.value === c)?.label || c;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <div className="text-sm font-medium">Total: <span className="text-destructive font-bold">৳{total.toLocaleString()}</span></div>
          <PermissionGate module="accounts" action="export">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          </PermissionGate>
          <PermissionGate module="accounts" action="create">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Office supplies for April" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (৳)</Label>
                      <Input type="number" min={0.01} step={0.01} value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v as PaymentMethod }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional details" rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : "Record Expense"}</Button>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No expenses recorded yet. Track your agency's operating costs here.</TableCell></TableRow>
              ) : (
                [...filtered].reverse().map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{exp.date}</TableCell>
                    <TableCell><Badge variant="outline">{getCatLabel(exp.category)}</Badge></TableCell>
                    <TableCell>{exp.description}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      <div className="flex items-center justify-end gap-1"><ArrowDownCircle className="h-3.5 w-3.5" />৳{exp.amount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">{exp.paymentMethod.replace("_", " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{exp.reference || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={exp.status === "approved" ? "bg-green-100 text-green-800" : exp.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                        {exp.status}
                      </Badge>
                    </TableCell>
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
