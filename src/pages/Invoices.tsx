import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Plus, Receipt, CreditCard, Eye, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailApi } from "@/lib/emailApi";
import { Progress } from "@/components/ui/progress";

type PaymentMethod = "cash" | "bank";
type InvoiceStatus = "unpaid" | "partial" | "paid";

interface Payment {
  id: string;
  invoiceId: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
}

interface Invoice {
  id: string;
  bookingId: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  tenantId: string;
  createdAt: string;
}

const statusColors: Record<InvoiceStatus, string> = {
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({ bookingId: "", totalAmount: 0 });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: "cash" as PaymentMethod, date: new Date().toISOString().split("T")[0] });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);
  const invoicePayments = payments.filter((p) => p.invoiceId === selectedInvoiceId);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const inv: Invoice = {
      id: crypto.randomUUID(),
      bookingId: invoiceForm.bookingId,
      totalAmount: invoiceForm.totalAmount,
      paidAmount: 0,
      dueAmount: invoiceForm.totalAmount,
      status: "unpaid",
      tenantId: "",
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [...prev, inv]);
    setInvoiceForm({ bookingId: "", totalAmount: 0 });
    setCreateDialogOpen(false);
    toast({ title: "Invoice created" });
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const payAmount = Math.min(paymentForm.amount, selectedInvoice.dueAmount);
    if (payAmount <= 0) {
      toast({ title: "Invalid amount", description: "Payment must be greater than 0 and not exceed due amount.", variant: "destructive" });
      return;
    }

    const payment: Payment = {
      id: crypto.randomUUID(),
      invoiceId: selectedInvoice.id,
      bookingId: selectedInvoice.bookingId,
      amount: payAmount,
      method: paymentForm.method,
      date: paymentForm.date,
    };
    setPayments((prev) => [...prev, payment]);

    // Auto-update invoice
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== selectedInvoice.id) return inv;
        const newPaid = inv.paidAmount + payAmount;
        const newDue = inv.totalAmount - newPaid;
        const newStatus: InvoiceStatus = newDue <= 0 ? "paid" : newPaid > 0 ? "partial" : "unpaid";
        return { ...inv, paidAmount: newPaid, dueAmount: Math.max(0, newDue), status: newStatus };
      })
    );

    setPaymentForm({ amount: 0, method: "cash", date: new Date().toISOString().split("T")[0] });
    setPayDialogOpen(false);
    toast({ title: "Payment recorded", description: `${payAmount.toFixed(2)} paid via ${paymentForm.method}` });
  };

  const totals = useMemo(() => ({
    total: invoices.reduce((s, i) => s + i.totalAmount, 0),
    paid: invoices.reduce((s, i) => s + i.paidAmount, 0),
    due: invoices.reduce((s, i) => s + i.dueAmount, 0),
  }), [invoices]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices & Payments</h1>
            <p className="text-muted-foreground">Track payments with installment support</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="space-y-2">
                  <Label>Booking ID</Label>
                  <Input value={invoiceForm.bookingId} onChange={(e) => setInvoiceForm((f) => ({ ...f, bookingId: e.target.value }))} placeholder="Reference booking" required />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <Input type="number" min={0.01} step={0.01} value={invoiceForm.totalAmount || ""} onChange={(e) => setInvoiceForm((f) => ({ ...f, totalAmount: parseFloat(e.target.value) || 0 }))} required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Create Invoice</Button>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Invoiced</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totals.total.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Paid</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{totals.paid.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Due</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-destructive">{totals.due.toFixed(2)}</div></CardContent>
          </Card>
        </div>

        {/* Invoice Table */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Invoices</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No invoices yet. Click "New Invoice" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => {
                    const pct = inv.totalAmount > 0 ? (inv.paidAmount / inv.totalAmount) * 100 : 0;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{inv.bookingId.slice(0, 8)}</TableCell>
                        <TableCell className="text-right">{inv.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600">{inv.paidAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">{inv.dueAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[inv.status]}`}>
                            {inv.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={inv.status === "paid"}
                              onClick={() => { setSelectedInvoiceId(inv.id); setPayDialogOpen(true); }}
                              title="Add Payment"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedInvoiceId(inv.id); setDetailDialogOpen(true); }}
                              title="View Payments"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Send invoice email"
                              onClick={async () => {
                                try {
                                  await emailApi.sendInvoice(inv.id);
                                  toast({ title: "Invoice email sent" });
                                } catch (err: any) {
                                  toast({ title: "Email failed", description: err.message, variant: "destructive" });
                                }
                              }}
                            >
                              <Mail className="h-4 w-4 text-primary" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Payment Dialog */}
        <Dialog open={payDialogOpen} onOpenChange={(open) => { setPayDialogOpen(open); if (!open) setSelectedInvoiceId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
            {selectedInvoice && (
              <div className="mb-2 rounded-md border p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid so far:</span>
                  <span className="text-green-600 font-medium">{selectedInvoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining due:</span>
                  <span className="text-destructive font-semibold">{selectedInvoice.dueAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={selectedInvoice?.dueAmount}
                  value={paymentForm.amount || ""}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((f) => ({ ...f, method: v as PaymentMethod }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Record Payment</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={(open) => { setDetailDialogOpen(open); if (!open) setSelectedInvoiceId(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Payment History</DialogTitle></DialogHeader>
            {selectedInvoice && (
              <>
                <div className="rounded-md border p-3 space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice:</span>
                    <span className="font-mono text-xs">{selectedInvoice.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total / Paid / Due:</span>
                    <span>{selectedInvoice.totalAmount.toFixed(2)} / <span className="text-green-600">{selectedInvoice.paidAmount.toFixed(2)}</span> / <span className="text-destructive">{selectedInvoice.dueAmount.toFixed(2)}</span></span>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicePayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No payments recorded</TableCell>
                      </TableRow>
                    ) : (
                      invoicePayments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.date}</TableCell>
                          <TableCell className="text-right font-medium">{p.amount.toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{p.method}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
