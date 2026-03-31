import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PaymentReq {
  id: string;
  tenantName: string;
  plan: string;
  amount: number;
  trxId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

const mockRequests: PaymentReq[] = [
  { id: "pr1", tenantName: "Acme Travel", plan: "pro", amount: 79, trxId: "TRX-9876543", status: "pending", submittedAt: "2026-03-28" },
  { id: "pr2", tenantName: "Globe Tours", plan: "basic", amount: 29, trxId: "TRX-1234567", status: "pending", submittedAt: "2026-03-29" },
  { id: "pr3", tenantName: "Star Holidays", plan: "business", amount: 199, trxId: "TRX-5551234", status: "approved", submittedAt: "2026-03-20" },
];

const AdminPayments = () => {
  const [requests, setRequests] = useState<PaymentReq[]>(mockRequests);
  const { toast } = useToast();

  const handleAction = (id: string, action: "approved" | "rejected") => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
    toast({
      title: action === "approved" ? "Payment approved — plan activated" : "Payment rejected",
      variant: action === "approved" ? "default" : "destructive",
    });
  };

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Requests</h1>
          <p className="text-muted-foreground">Approve or reject subscription payments from tenants</p>
        </div>

        {/* Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Approval
              {pending.length > 0 && <Badge variant="destructive">{pending.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No pending requests 🎉</TableCell>
                  </TableRow>
                ) : (
                  pending.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.tenantName}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{r.plan}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">৳{r.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.trxId}</TableCell>
                      <TableCell className="text-muted-foreground">{r.submittedAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleAction(r.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAction(r.id, "rejected")}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Processed */}
        <Card>
          <CardHeader><CardTitle>Processed Requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No processed requests yet.</TableCell>
                  </TableRow>
                ) : (
                  processed.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.tenantName}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{r.plan}</Badge></TableCell>
                      <TableCell className="text-right">${r.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.trxId}</TableCell>
                      <TableCell>
                        {r.status === "approved" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>
                        ) : (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.submittedAt}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
