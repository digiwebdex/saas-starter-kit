import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, Image, CreditCard, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PayReqStatus = "pending" | "approved" | "rejected";
type PayMethod = "bkash" | "sslcommerz" | "manual";

interface PaymentReq {
  id: string;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  plan: string;
  amount: number;
  method: PayMethod;
  trxId: string;
  proofUrl: string;
  status: PayReqStatus;
  submittedAt: string;
  processedAt?: string;
}

const mockRequests: PaymentReq[] = [
  { id: "pr1", tenantId: "t1", tenantName: "Acme Travel", ownerEmail: "john@acme.com", plan: "pro", amount: 1999, method: "bkash", trxId: "TRX-9876543", proofUrl: "https://placehold.co/400x600/22c55e/fff?text=bKash+Receipt", status: "pending", submittedAt: "2026-03-28" },
  { id: "pr2", tenantId: "t2", tenantName: "Globe Tours", ownerEmail: "jane@globe.com", plan: "basic", amount: 999, method: "manual", trxId: "TRX-1234567", proofUrl: "https://placehold.co/400x600/3b82f6/fff?text=Bank+Slip", status: "pending", submittedAt: "2026-03-29" },
  { id: "pr3", tenantId: "t3", tenantName: "Star Holidays", ownerEmail: "ali@star.com", plan: "business", amount: 4999, method: "sslcommerz", trxId: "TRX-5551234", proofUrl: "", status: "approved", submittedAt: "2026-03-20", processedAt: "2026-03-21" },
  { id: "pr4", tenantId: "t4", tenantName: "Royal Travels", ownerEmail: "royal@travel.com", plan: "pro", amount: 1999, method: "bkash", trxId: "TRX-7778899", proofUrl: "https://placehold.co/400x600/f59e0b/fff?text=bKash+Screenshot", status: "rejected", submittedAt: "2026-03-25", processedAt: "2026-03-26" },
  { id: "pr5", tenantId: "t5", tenantName: "Dream Trips", ownerEmail: "dream@trips.com", plan: "basic", amount: 999, method: "manual", trxId: "TRX-3334455", proofUrl: "https://placehold.co/400x600/8b5cf6/fff?text=Bank+Receipt", status: "pending", submittedAt: "2026-03-30" },
];

const methodLabels: Record<PayMethod, { label: string; color: string }> = {
  bkash: { label: "bKash", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  sslcommerz: { label: "SSLCommerz", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  manual: { label: "Manual / Bank", color: "bg-muted text-muted-foreground" },
};

const AdminPayments = () => {
  const [requests, setRequests] = useState<PaymentReq[]>(mockRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PayReqStatus>("all");
  const [selectedReq, setSelectedReq] = useState<PaymentReq | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch = r.tenantName.toLowerCase().includes(search.toLowerCase()) ||
        r.trxId.toLowerCase().includes(search.toLowerCase()) ||
        r.ownerEmail.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalAmount: requests.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0),
  }), [requests]);

  const handleAction = (id: string, action: "approved" | "rejected") => {
    const req = requests.find((r) => r.id === id);
    setRequests((prev) => prev.map((r) =>
      r.id === id ? { ...r, status: action, processedAt: new Date().toISOString().split("T")[0] } : r
    ));
    if (action === "approved") {
      toast({
        title: "✅ Payment Approved — Subscription Activated",
        description: `${req?.tenantName}'s ${req?.plan} plan is now active.`,
      });
    } else {
      toast({
        title: "❌ Payment Rejected",
        description: `${req?.tenantName}'s payment has been marked as failed.`,
        variant: "destructive",
      });
    }
    setDetailOpen(false);
  };

  const statusBadge = (status: PayReqStatus) => {
    const map: Record<PayReqStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>{status}</span>;
  };

  const openDetail = (req: PaymentReq) => {
    setSelectedReq(req);
    setDetailOpen(true);
  };

  const openProof = (url: string) => {
    setProofUrl(url);
    setProofOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Requests</h1>
          <p className="text-muted-foreground">Review, approve or reject subscription payments from tenants</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">৳{stats.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Approved Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company, email or TRX ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Payment Requests ({filtered.length})
              {stats.pending > 0 && <Badge variant="destructive">{stats.pending} pending</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>TRX ID</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No payment requests found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id} className={r.status === "rejected" ? "opacity-60" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{r.tenantName}</p>
                          <p className="text-xs text-muted-foreground">{r.ownerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{r.plan}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">৳{r.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${methodLabels[r.method].color}`}>
                          {methodLabels[r.method].label}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.trxId}</TableCell>
                      <TableCell>
                        {r.proofUrl ? (
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => openProof(r.proofUrl)}>
                            <Image className="h-3.5 w-3.5" /> View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No proof</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.submittedAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetail(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {r.status === "pending" && (
                            <>
                              <Button size="sm" className="h-8" onClick={() => handleAction(r.id, "approved")}>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-8" onClick={() => handleAction(r.id, "rejected")}>
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Payment Request Details</DialogTitle></DialogHeader>
            {selectedReq && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{selectedReq.tenantName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedReq.ownerEmail}</span>
                  <span className="text-muted-foreground">Plan:</span>
                  <Badge variant="secondary" className="capitalize w-fit">{selectedReq.plan}</Badge>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg">৳{selectedReq.amount.toLocaleString()}</span>
                  <span className="text-muted-foreground">Method:</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit ${methodLabels[selectedReq.method].color}`}>
                    {methodLabels[selectedReq.method].label}
                  </span>
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono text-xs">{selectedReq.trxId}</span>
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{selectedReq.submittedAt}</span>
                  <span className="text-muted-foreground">Status:</span>
                  {statusBadge(selectedReq.status)}
                  {selectedReq.processedAt && (
                    <>
                      <span className="text-muted-foreground">Processed:</span>
                      <span>{selectedReq.processedAt}</span>
                    </>
                  )}
                </div>

                {/* Proof Image */}
                {selectedReq.proofUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payment Proof</p>
                    <div
                      className="rounded-lg border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => { setDetailOpen(false); openProof(selectedReq.proofUrl); }}
                    >
                      <img
                        src={selectedReq.proofUrl}
                        alt="Payment proof"
                        className="w-full max-h-48 object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedReq.status === "pending" ? (
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" onClick={() => handleAction(selectedReq.id, "approved")}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve & Activate
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleAction(selectedReq.id, "rejected")}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      This request was <strong className="capitalize">{selectedReq.status}</strong>
                      {selectedReq.processedAt && ` on ${selectedReq.processedAt}`}
                    </p>
                    {selectedReq.status === "approved" && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Subscription was activated for this tenant.</p>
                    )}
                    {selectedReq.status === "rejected" && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Payment was marked as failed.</p>
                    )}
                  </div>
                )}
                <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Proof Image Dialog */}
        <Dialog open={proofOpen} onOpenChange={setProofOpen}>
          <DialogContent className="max-w-md p-2">
            <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
            {proofUrl && (
              <img src={proofUrl} alt="Payment proof" className="w-full rounded-lg" />
            )}
            <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
