import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Crown, Zap, Rocket, Star, Gem, AlertTriangle, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanType } from "@/lib/plans";
import { usePlanAccess } from "@/hooks/usePlanAccess";

type SubStatus = "active" | "expired" | "pending" | "cancelled";
type PayReqStatus = "pending" | "approved" | "rejected";

interface Subscription {
  id: string;
  plan: PlanType;
  startDate: string;
  endDate: string;
  status: SubStatus;
}

interface PaymentRequest {
  id: string;
  plan: PlanType;
  amount: number;
  trxId: string;
  method: "manual" | "bkash" | "sslcommerz";
  status: PayReqStatus;
  createdAt: string;
}

const planIcons: Record<string, React.ElementType> = {
  free: Star, basic: Zap, pro: Crown, business: Rocket, enterprise: Gem,
};

const Subscription_Page = () => {
  const [currentSub, setCurrentSub] = useState<Subscription>({
    id: "1",
    plan: "free",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "active",
  });
  const [payRequests, setPayRequests] = useState<PaymentRequest[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [payForm, setPayForm] = useState({ trxId: "", method: "manual" as "manual" | "bkash" | "sslcommerz" });
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [isAdmin] = useState(true);
  const { toast } = useToast();

  const access = usePlanAccess(currentSub.plan);
  const selectedPlanInfo = PLANS.find((p) => p.id === selectedPlan);
  const hasPendingRequest = payRequests.some((r) => r.status === "pending");

  // Check if subscription is expiring soon (within 7 days)
  const daysUntilExpiry = useMemo(() => {
    if (!currentSub.endDate) return null;
    const diff = new Date(currentSub.endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [currentSub.endDate]);

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === currentSub.plan) return;
    if (plan === "free") {
      setCurrentSub((s) => ({ ...s, plan: "free", status: "active", endDate: "" }));
      toast({ title: "Downgraded to Free" });
      return;
    }
    if (plan === "enterprise") {
      toast({ title: "Contact Sales", description: "Enterprise plans require custom pricing. Please contact us at support@globexconnect.com" });
      return;
    }
    if (hasPendingRequest) {
      toast({ title: "Pending request exists", description: "Wait for admin approval before submitting another.", variant: "destructive" });
      return;
    }
    setSelectedPlan(plan);
    setPayDialogOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanInfo) return;
    const req: PaymentRequest = {
      id: crypto.randomUUID(),
      plan: selectedPlanInfo.id,
      amount: selectedPlanInfo.price,
      trxId: payForm.trxId,
      method: payForm.method,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setPayRequests((prev) => [...prev, req]);
    setPayForm({ trxId: "", method: "manual" });
    setSelectedPlan(null);
    setPayDialogOpen(false);
    toast({ title: "Payment submitted", description: "Waiting for admin approval to activate your plan." });
  };

  const handleApprove = (reqId: string) => {
    const req = payRequests.find((r) => r.id === reqId);
    if (!req) return;
    setPayRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "approved" as PayReqStatus } : r));
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    setCurrentSub({
      id: crypto.randomUUID(),
      plan: req.plan,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      status: "active",
    });
    toast({ title: "Plan activated!", description: `${req.plan} plan is now active until ${end.toISOString().split("T")[0]}.` });
  };

  const handleReject = (reqId: string) => {
    setPayRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "rejected" as PayReqStatus } : r));
    toast({ title: "Payment rejected", variant: "destructive" });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] || ""}`}>{status}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">Choose a plan and manage your subscription</p>
        </div>

        {/* Expiry Warning */}
        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Subscription expires in {daysUntilExpiry} day{daysUntilExpiry > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">Renew now to avoid service interruption.</p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto border-yellow-500 text-yellow-700" onClick={() => handleSelectPlan(currentSub.plan === "free" ? "basic" : currentSub.plan)}>
              Renew Now
            </Button>
          </div>
        )}

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className="text-base px-3 py-1 capitalize">{currentSub.plan}</Badge>
              {statusBadge(currentSub.status)}
              {currentSub.endDate && (
                <span className="text-sm text-muted-foreground">Expires: {currentSub.endDate}</span>
              )}
              <div className="ml-auto text-sm text-muted-foreground">
                <span className="font-medium">Plan Features: </span>
                {access.canUsePaymentGateway && <Badge variant="outline" className="mr-1 text-xs">Payment Gateway</Badge>}
                {access.canUseCustomDomain && <Badge variant="outline" className="mr-1 text-xs">Custom Domain</Badge>}
                {access.canUseSms && <Badge variant="outline" className="mr-1 text-xs">SMS</Badge>}
                {access.canUseWhatsApp && <Badge variant="outline" className="mr-1 text-xs">WhatsApp</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PLANS.map((p) => {
            const isCurrent = currentSub.plan === p.id;
            const Icon = planIcons[p.id] || Star;
            const isHighlighted = p.badge === "Most Popular" || p.badge === "Best Value";
            return (
              <Card key={p.id} className={`relative ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""} ${isHighlighted ? "shadow-lg" : ""}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Current</Badge>
                  </div>
                )}
                {p.badge && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={p.badge === "Most Popular" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}>{p.badge}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <Icon className="mx-auto h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>
                    {p.price === -1 ? (
                      <span className="text-2xl font-bold text-foreground">Custom</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-foreground">৳{p.price.toLocaleString()}</span>
                        {p.price > 0 && <span className="text-muted-foreground">/মাস</span>}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {p.features.length > 4 && (
                      <li className="text-xs text-muted-foreground">+{p.features.length - 4} more</li>
                    )}
                  </ul>
                  <Button
                    className="w-full"
                    size="sm"
                    variant={isCurrent ? "outline" : isHighlighted ? "default" : "secondary"}
                    disabled={isCurrent || hasPendingRequest}
                    onClick={() => handleSelectPlan(p.id)}
                  >
                    {isCurrent ? "Current Plan" : hasPendingRequest ? "Request Pending" : p.price === -1 ? "Contact Sales" : `Select ${p.name}`}
                    {!isCurrent && !hasPendingRequest && <ArrowUpRight className="ml-1 h-3.5 w-3.5" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Requests</CardTitle>
            <CardDescription>
              {isAdmin ? "Review and approve payment requests" : "Your payment request history"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-[140px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                      No payment requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...payRequests].reverse().map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize font-medium">{req.plan}</TableCell>
                      <TableCell className="text-right">৳{req.amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{req.method}</TableCell>
                      <TableCell className="font-mono text-xs">{req.trxId}</TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          {req.status === "pending" ? (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => handleApprove(req.id)}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>Reject</Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Submit Payment Dialog */}
        <Dialog open={payDialogOpen} onOpenChange={(open) => { setPayDialogOpen(open); if (!open) setSelectedPlan(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Payment</DialogTitle></DialogHeader>
            {selectedPlanInfo && (
              <div className="rounded-md border p-4 mb-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium capitalize">{selectedPlanInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold">৳{selectedPlanInfo.price.toLocaleString()}/মাস</span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 space-y-1">
                  <p className="font-medium">Payment Instructions:</p>
                  <p>• bKash: Send to 01XXXXXXXXX (Merchant)</p>
                  <p>• Bank: Transfer to [Bank Account Details]</p>
                  <p>• Enter your transaction ID below after payment</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v as "manual" | "bkash" | "sslcommerz" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (Bank Transfer / Cash)</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="sslcommerz">SSLCommerz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction ID / Reference</Label>
                <Input
                  value={payForm.trxId}
                  onChange={(e) => setPayForm((f) => ({ ...f, trxId: e.target.value }))}
                  placeholder="e.g. TRX-123456789"
                  required
                  minLength={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Submit Payment</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Subscription_Page;
