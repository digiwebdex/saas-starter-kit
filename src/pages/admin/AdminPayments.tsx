import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Eye, CheckCircle, XCircle, Image, CreditCard, Clock,
  DollarSign, Download, MessageSquare, History, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/auditLog";

type PayReqStatus = "pending" | "approved" | "rejected";
type PayMethod = "bkash" | "sslcommerz" | "manual";

interface ApprovalRecord {
  action: "approved" | "rejected";
  reviewerName: string;
  reviewerEmail: string;
  comment: string;
  timestamp: string;
}

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
  reviewerComment?: string;
  approvalHistory: ApprovalRecord[];
}

const mockRequests: PaymentReq[] = [
  { id: "pr1", tenantId: "t1", tenantName: "Acme Travel", ownerEmail: "john@acme.com", plan: "pro", amount: 1500, method: "bkash", trxId: "TRX-9876543", proofUrl: "https://placehold.co/400x600/22c55e/fff?text=bKash+Receipt", status: "pending", submittedAt: "2026-03-28", approvalHistory: [] },
  { id: "pr2", tenantId: "t2", tenantName: "Globe Tours", ownerEmail: "jane@globe.com", plan: "basic", amount: 800, method: "manual", trxId: "TRX-1234567", proofUrl: "https://placehold.co/400x600/3b82f6/fff?text=Bank+Slip", status: "pending", submittedAt: "2026-03-29", approvalHistory: [] },
  { id: "pr3", tenantId: "t3", tenantName: "Star Holidays", ownerEmail: "ali@star.com", plan: "business", amount: 3000, method: "sslcommerz", trxId: "TRX-5551234", proofUrl: "", status: "approved", submittedAt: "2026-03-20", processedAt: "2026-03-21", reviewerComment: "Payment verified against bank statement", approvalHistory: [{ action: "approved", reviewerName: "Super Admin", reviewerEmail: "admin@skyline.com", comment: "Payment verified against bank statement", timestamp: "2026-03-21T10:30:00Z" }] },
  { id: "pr4", tenantId: "t4", tenantName: "Royal Travels", ownerEmail: "royal@travel.com", plan: "pro", amount: 1500, method: "bkash", trxId: "TRX-7778899", proofUrl: "https://placehold.co/400x600/f59e0b/fff?text=bKash+Screenshot", status: "rejected", submittedAt: "2026-03-25", processedAt: "2026-03-26", reviewerComment: "Transaction ID not found in bKash records", approvalHistory: [{ action: "rejected", reviewerName: "Super Admin", reviewerEmail: "admin@skyline.com", comment: "Transaction ID not found in bKash records", timestamp: "2026-03-26T14:00:00Z" }] },
  { id: "pr5", tenantId: "t5", tenantName: "Dream Trips", ownerEmail: "dream@trips.com", plan: "basic", amount: 800, method: "manual", trxId: "TRX-3334455", proofUrl: "https://placehold.co/400x600/8b5cf6/fff?text=Bank+Receipt", status: "pending", submittedAt: "2026-03-30", approvalHistory: [] },
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
  const [reviewComment, setReviewComment] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approved" | "rejected" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyReq, setHistoryReq] = useState<PaymentReq | null>(null);
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
    totalApproved: requests.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0),
    totalPending: requests.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0),
  }), [requests]);

  const handleAction = (id: string, action: "approved" | "rejected") => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    // Prevent duplicate approvals
    if (req.status !== "pending") {
      toast({ title: "Already processed", description: `This request was already ${req.status}.`, variant: "destructive" });
      return;
    }

    const record: ApprovalRecord = {
      action,
      reviewerName: "Super Admin",
      reviewerEmail: "admin@skyline.com",
      comment: reviewComment.trim(),
      timestamp: new Date().toISOString(),
    };

    setRequests((prev) => prev.map((r) =>
      r.id === id ? {
        ...r,
        status: action,
        processedAt: new Date().toISOString().split("T")[0],
        reviewerComment: reviewComment.trim() || undefined,
        approvalHistory: [...r.approvalHistory, record],
      } : r
    ));

    // Log to audit
    logAudit({
      actorId: "u-admin",
      actorName: "Super Admin",
      actorEmail: "admin@skyline.com",
      actorRole: "super_admin",
      tenantId: req.tenantId,
      tenantName: req.tenantName,
      module: "payment",
      action: action === "approved" ? "payment_approved" : "payment_rejected",
      targetType: "payment_request",
      targetId: req.id,
      targetLabel: `${req.trxId} (৳${req.amount.toLocaleString()})`,
      oldValue: "pending",
      newValue: action,
      metadata: reviewComment.trim() ? { reviewerComment: reviewComment.trim() } : undefined,
    });

    if (action === "approved") {
      toast({ title: "✅ Payment Approved — Subscription Activated", description: `${req.tenantName}'s ${req.plan} plan is now active.` });
    } else {
      toast({ title: "❌ Payment Rejected", description: `${req.tenantName}'s payment has been rejected.`, variant: "destructive" });
    }
    setDetailOpen(false);
    setConfirmAction(null);
    setReviewComment("");
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
    setReviewComment("");
    setConfirmAction(null);
    setDetailOpen(true);
  };

  const openProof = (url: string) => { setProofUrl(url); setProofOpen(true); };
  const openHistory = (req: PaymentReq) => { setHistoryReq(req); setHistoryOpen(true); };

  const handleExport = () => {
    const headers = ["Date", "Company", "Email", "Plan", "Amount", "Method", "TRX ID", "Status", "Processed", "Comment"];
    const rows = filtered.map((r) => [r.submittedAt, r.tenantName, r.ownerEmail, r.plan, r.amount, r.method, r.trxId, r.status, r.processedAt || "", r.reviewerComment || ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payment-requests.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Requests</h1>
            <p className="text-muted-foreground">Review, approve or reject subscription payments from tenants</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CreditCard className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Requests</p></div></div></CardContent></Card>
          <Card className={stats.pending > 0 ? "border-yellow-300 dark:border-yellow-600" : ""}><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-red-500" /><div><p className="text-2xl font-bold">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">৳{stats.totalApproved.toLocaleString()}</p><p className="text-xs text-muted-foreground">Approved Revenue</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">৳{stats.totalPending.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending Amount</p></div></div></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company, email or TRX ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
              <SelectItem value="approved">Approved ({stats.approved})</SelectItem>
              <SelectItem value="rejected">Rejected ({stats.rejected})</SelectItem>
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
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No payment requests found.</TableCell></TableRow>
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
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{r.submittedAt}</div>
                        {r.processedAt && <div className="text-[10px]">✓ {r.processedAt}</div>}
                      </TableCell>
                      <TableCell>
                        {r.reviewerComment ? (
                          <span className="text-xs text-muted-foreground line-clamp-2" title={r.reviewerComment}>
                            <MessageSquare className="inline h-3 w-3 mr-0.5" />{r.reviewerComment}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Details" onClick={() => openDetail(r)}><Eye className="h-3.5 w-3.5" /></Button>
                          {r.approvalHistory.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="History" onClick={() => openHistory(r)}><History className="h-3.5 w-3.5" /></Button>
                          )}
                          {r.status === "pending" && (
                            <>
                              <Button size="sm" className="h-7 text-xs" onClick={() => { openDetail(r); setConfirmAction("approved"); }}>
                                <CheckCircle className="mr-1 h-3 w-3" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { openDetail(r); setConfirmAction("rejected"); }}>
                                <XCircle className="mr-1 h-3 w-3" /> Reject
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
        <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) { setConfirmAction(null); setReviewComment(""); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Payment Request Details</DialogTitle></DialogHeader>
            {selectedReq && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{selectedReq.tenantName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedReq.ownerEmail}</span>
                  <span className="text-muted-foreground">Requested Plan:</span>
                  <Badge variant="secondary" className="capitalize w-fit">{selectedReq.plan}</Badge>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg">৳{selectedReq.amount.toLocaleString()}</span>
                  <span className="text-muted-foreground">Method:</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit ${methodLabels[selectedReq.method].color}`}>
                    {methodLabels[selectedReq.method].label}
                  </span>
                  <span className="text-muted-foreground">Reference No:</span>
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
                  {selectedReq.reviewerComment && (
                    <>
                      <span className="text-muted-foreground">Reviewer Comment:</span>
                      <span className="text-sm">{selectedReq.reviewerComment}</span>
                    </>
                  )}
                </div>

                {selectedReq.proofUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payment Proof</p>
                    <div className="rounded-lg border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { setDetailOpen(false); openProof(selectedReq.proofUrl); }}>
                      <img src={selectedReq.proofUrl} alt="Payment proof" className="w-full max-h-48 object-cover" />
                    </div>
                  </div>
                )}

                {/* Approval History */}
                {selectedReq.approvalHistory.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <p className="text-sm font-medium flex items-center gap-1"><History className="h-3.5 w-3.5" /> Approval History</p>
                    {selectedReq.approvalHistory.map((h, i) => (
                      <div key={i} className="rounded-md border p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${h.action === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>{h.action}</span>
                          <span className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">by {h.reviewerName} ({h.reviewerEmail})</p>
                        {h.comment && <p className="text-xs"><MessageSquare className="inline h-3 w-3 mr-1" />{h.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Review Action */}
                {selectedReq.status === "pending" ? (
                  <div className="space-y-3 pt-2">
                    <Separator />
                    <div className="space-y-2">
                      <Label>Reviewer Comment (optional)</Label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Add a comment about this payment..."
                        rows={2}
                      />
                    </div>
                    {confirmAction ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-center">
                          {confirmAction === "approved" ? "✅ Confirm approval?" : "❌ Confirm rejection?"}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            variant={confirmAction === "approved" ? "default" : "destructive"}
                            onClick={() => handleAction(selectedReq.id, confirmAction)}
                          >
                            {confirmAction === "approved" ? "Yes, Approve & Activate" : "Yes, Reject Payment"}
                          </Button>
                          <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => setConfirmAction("approved")}>
                          <CheckCircle className="mr-2 h-4 w-4" /> Approve & Activate
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => setConfirmAction("rejected")}>
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      This request was <strong className="capitalize">{selectedReq.status}</strong>
                      {selectedReq.processedAt && ` on ${selectedReq.processedAt}`}
                    </p>
                  </div>
                )}
                <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Approval History — {historyReq?.tenantName}</DialogTitle></DialogHeader>
            {historyReq && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  TRX: <span className="font-mono">{historyReq.trxId}</span> • ৳{historyReq.amount.toLocaleString()} • {historyReq.plan}
                </div>
                {historyReq.approvalHistory.map((h, i) => (
                  <div key={i} className="rounded-md border p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${h.action === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>{h.action}</span>
                      <span className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">by {h.reviewerName} ({h.reviewerEmail})</p>
                    {h.comment && <p className="text-xs"><MessageSquare className="inline h-3 w-3 mr-1" />{h.comment}</p>}
                  </div>
                ))}
              </div>
            )}
            <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
          </DialogContent>
        </Dialog>

        {/* Proof Image Dialog */}
        <Dialog open={proofOpen} onOpenChange={setProofOpen}>
          <DialogContent className="max-w-md p-2">
            <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
            {proofUrl && <img src={proofUrl} alt="Payment proof" className="w-full rounded-lg" />}
            <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
