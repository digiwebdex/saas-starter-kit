import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Smartphone, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentGatewayApi, type PaymentGateway } from "@/lib/paymentGatewayApi";

interface PaymentGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  amount: number;
  onSuccess?: () => void;
}

const gateways: { id: PaymentGateway; name: string; icon: React.ReactNode; description: string; badge?: string }[] = [
  {
    id: "sslcommerz",
    name: "SSLCommerz",
    icon: <CreditCard className="h-6 w-6" />,
    description: "Pay with Visa, Mastercard, Mobile Banking, Internet Banking",
    badge: "Recommended",
  },
  {
    id: "bkash",
    name: "bKash",
    icon: <Smartphone className="h-6 w-6" />,
    description: "Pay using bKash mobile wallet",
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    icon: <Truck className="h-6 w-6" />,
    description: "Pay in cash when service is delivered",
  },
];

const PaymentGatewayDialog = ({ open, onOpenChange, invoiceId, amount, onSuccess }: PaymentGatewayDialogProps) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    if (!selectedGateway) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({ title: "Missing info", description: "Name and phone are required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await paymentGatewayApi.initiate({
        invoiceId,
        amount,
        gateway: selectedGateway,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
      });

      if (res.redirectUrl) {
        // SSLCommerz / bKash → redirect to payment page
        window.location.href = res.redirectUrl;
      } else {
        // COD → confirmed immediately
        toast({ title: "Order confirmed", description: res.message || "Cash on delivery order placed." });
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedGateway(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Now — ৳{amount.toFixed(2)}</DialogTitle>
        </DialogHeader>

        {/* Step 1: Select gateway */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Payment Method</Label>
          {gateways.map((gw) => (
            <Card
              key={gw.id}
              className={`cursor-pointer transition-all ${
                selectedGateway === gw.id
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedGateway(gw.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 text-primary">{gw.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{gw.name}</span>
                    {gw.badge && <Badge variant="secondary" className="text-xs">{gw.badge}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{gw.description}</p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                  selectedGateway === gw.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {selectedGateway === gw.id && <div className="h-full w-full rounded-full bg-primary-foreground scale-50" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Step 2: Customer details */}
        {selectedGateway && (
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium">Customer Details</Label>
            <div className="space-y-2">
              <Input
                placeholder="Full name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={100}
                required
              />
              <Input
                type="email"
                placeholder="Email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                maxLength={255}
              />
              <Input
                placeholder="Phone number *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                maxLength={20}
                required
              />
            </div>
            <Button className="w-full" onClick={handlePay} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : selectedGateway === "cod" ? (
                <Truck className="mr-2 h-4 w-4" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {selectedGateway === "cod" ? "Confirm COD Order" : `Pay ৳${amount.toFixed(2)}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentGatewayDialog;
