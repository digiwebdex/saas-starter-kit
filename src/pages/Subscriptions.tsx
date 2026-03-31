import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Check, Crown, Zap, Rocket, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PlanType = "free" | "basic" | "pro" | "business";
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
  status: PayReqStatus;
  createdAt: string;
}

const plans: { plan: PlanType; name: string; price: number; icon: React.ElementType; features: string[] }[] = [
  { plan: "free", name: "Free", price: 0, icon: Star, features: ["5 Bookings/month", "1 User", "Basic Reports"] },
  { plan: "basic", name: "Basic", price: 29, icon: Zap, features: ["50 Bookings/month", "5 Users", "Full Reports", "Email Support"] },
  { plan: "pro", name: "Pro", price: 79, icon: Crown, features: ["Unlimited Bookings", "20 Users", "Advanced Analytics", "Priority Support"] },
  { plan: "business", name: "Business", price: 199, icon: Rocket, features: ["Everything in Pro", "Unlimited Users", "Custom Integrations", "Dedicated Manager", "API Access"] },
];

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
  const [payForm, setPayForm] = useState({ trxId: "" });
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [isAdmin] = useState(true); // In production, derive from auth context
  const { toast } = useToast();

  const selectedPlanInfo = plans.find((p) => p.plan === selectedPlan);
  const hasPendingRequest = payRequests.some((r) => r.status === "pending");

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === currentSub.plan) return;
    if (plan === "free") {
      setCurrentSub((s) => ({ ...s, plan: "free", status: "active", endDate: "" }));
      toast({ title: "Downgraded to Free" });
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
      plan: selectedPlanInfo.plan,
      amount: selectedPlanInfo.price,
      trxId: payForm.trxId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setPayRequests((prev) => [...prev, req]);
    setPayForm({ trxId: "" });
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

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className="text-base px-3 py-1 capitalize">{currentSub.plan}</Badge>
              {statusBadge(currentSub.status)}
              {currentSub.endDate && (
                <span className="text-sm text-muted-foreground">Expires: {currentSub.endDate}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const isCurrent = currentSub.plan === p.plan;
            return (
              <Card key={p.plan} className={`relative ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Current</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <p.icon className="mx-auto h-8 w-8 text-primary mb-2" />
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">${p.price}</span>
                    {p.price > 0 && <span className="text-muted-foreground">/mo</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || hasPendingRequest}
                    onClick={() => handleSelectPlan(p.plan)}
                  >
                    {isCurrent ? "Current Plan" : hasPendingRequest ? "Request Pending" : `Select ${p.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Requests (Admin View) */}
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
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-[140px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                      No payment requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...payRequests].reverse().map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize font-medium">{req.plan}</TableCell>
                      <TableCell className="text-right">${req.amount.toFixed(2)}</TableCell>
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
                  <span className="font-bold">${selectedPlanInfo.price.toFixed(2)}/mo</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Transfer the amount to the company bank account, then enter your transaction ID below.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Transaction ID / Reference</Label>
                <Input
                  value={payForm.trxId}
                  onChange={(e) => setPayForm({ trxId: e.target.value })}
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
