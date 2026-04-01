import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, CheckCircle2 } from "lucide-react";
import { invoiceApi, type Invoice, type Payment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const InvoiceReceipt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [inv, pays] = await Promise.all([
          invoiceApi.get(id),
          invoiceApi.getPayments(id).catch(() => []),
        ]);
        setInvoice(inv);
        setPayments(pays);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading receipt...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
        </Button>
      </div>
    );
  }

  const methodLabel = (m: string) =>
    ({ cash: "Cash", bank: "Bank Transfer", card: "Card", mobile_banking: "Mobile Banking", cheque: "Cheque", online: "Online" }[m] || m);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
      </div>

      {/* Receipt content */}
      <div className="max-w-[700px] mx-auto py-8 px-4 print:px-0 print:py-0 print:max-w-full" ref={printRef}>
        <div className="bg-background rounded-lg border p-8 print:border-0 print:shadow-none print:rounded-none space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold">Payment Receipt</h1>
            <p className="text-sm text-muted-foreground">
              Invoice: {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 6).toUpperCase()}`}
            </p>
          </div>

          <Separator />

          {/* Invoice summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Client</p>
              <p className="font-medium">{invoice.clientName || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs mb-0.5">Booking</p>
              <p className="font-medium">{invoice.bookingTitle || invoice.bookingId?.slice(0, 8) || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Invoice Date</p>
              <p>{invoice.createdAt?.slice(0, 10) || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs mb-0.5">Due Date</p>
              <p>{invoice.dueDate || "Not set"}</p>
            </div>
          </div>

          <Separator />

          {/* Financial summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice Total</span>
              <span className="font-semibold">৳{invoice.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-green-600">৳{invoice.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Due</span>
              <span className={`font-semibold ${invoice.dueAmount > 0 ? "text-destructive" : "text-green-600"}`}>
                ৳{invoice.dueAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <Separator />

          {/* Payment history */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-1.5 font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-1.5 font-medium text-muted-foreground">Reference</th>
                    <th className="text-left py-1.5 font-medium text-muted-foreground">Received By</th>
                    <th className="text-right py-1.5 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-1.5">{p.date}</td>
                      <td className="py-1.5">{methodLabel(p.method)}</td>
                      <td className="py-1.5 text-muted-foreground">{p.transactionRef || "—"}</td>
                      <td className="py-1.5 text-muted-foreground">{p.receivedByName || "—"}</td>
                      <td className="py-1.5 text-right font-medium text-green-600">৳{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReceipt;
