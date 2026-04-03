import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Eye, CheckCircle, XCircle, CreditCard, Clock,
  DollarSign, Download, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminApi, type AdminPaymentRequest } from "@/lib/api";

const AdminPayments = () => {
  const [requests, setRequests] = useState<AdminPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [selectedReq, setSelectedReq] = useState<AdminPaymentRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPaymentRequests();
      setRequests(data);
    } catch (err: any) {
      toast({ title: "Failed to load payment requests", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch = (r.trxId || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.tenantId || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalApproved: requests.filter((r) => r.status === "approved").reduce((s, r) => s + (r.amount || 0), 0),
    totalPending: requests.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amount || 0), 0),
  }), [requests]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setActionLoading(true);
    try {
      await adminApi.updatePaymentRequest(id, {
        status: action,
        reviewerComment: reviewComment.trim() || undefined,
      } as any);
      setRequests((prev) => prev.map((r) =>
        r.id === id ? { ...r, status: action, reviewerComment: reviewComment.trim() || r.reviewerComment } : r
      ));
      toast({
        title: action === "approved" ? "✅ Payment Approved" : "❌ Payment Rejected",
        description: action === "approved" ? "Subscription activated." : "Payment rejected.",
        variant: action === "rejected" ? "destructive" : "default",
      });
      setDetailOpen(false);
      setReviewComment("");
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] || ""}`}>{status}</span>;
  };

  const handleExport = () => {
    const headers = ["Date", "Plan", "Amount", "Method", "TRX ID", "Status", "Comment"];
    const rows = filtered.map((r) => [
      new Date(r.createdAt).toLocaleDateString(), r.plan, r.amount, r.method, r.trxId, r.status, r.reviewerComment || ""
    ]);
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CreditCard className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{loading ? "…" : stats.total}</p><p className="text-xs text-muted-foreground">Total Requests</p></div></div></CardContent></Card>
          <Card className={stats.pending > 0 ? "border-yellow-300 dark:border-yellow-600" : ""}><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{loading ? "…" : stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{loading ? "…" : stats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-red-500" /><div><p className="text-2xl font-bold">{loading ? "…" : stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">৳{stats.totalApproved.toLocaleString()}</p><p className="text-xs text-muted-foreground">Approved Revenue</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">৳{stats.totalPending.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending Amount</p></div></div></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search TRX ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
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
            {loading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>TRX ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payment requests found.</TableCell></TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id} className={r.status === "rejected" ? "opacity-60" : ""}>
                        <TableCell><Badge variant="secondary" className="capitalize">{r.plan}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">৳{(r.amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="capitalize text-sm">{r.method}</TableCell>
                        <TableCell className="font-mono text-xs">{r.trxId || "—"}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Details" onClick={() => { setSelectedReq(r); setDetailOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {r.status === "pending" && (
                              <>
                                <Button size="sm" className="h-7 text-xs" onClick={() => { setSelectedReq(r); setDetailOpen(true); }}>
                                  <CheckCircle className="mr-1 h-3 w-3" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setSelectedReq(r); setDetailOpen(true); }}>
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
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setReviewComment(""); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Payment Request Details</DialogTitle></DialogHeader>
            {selectedReq && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium capitalize">{selectedReq.plan}</span>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold">৳{(selectedReq.amount || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">Method:</span>
                  <span className="capitalize">{selectedReq.method}</span>
                  <span className="text-muted-foreground">TRX ID:</span>
                  <span className="font-mono text-xs">{selectedReq.trxId || "—"}</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span>{statusBadge(selectedReq.status)}</span>
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(selectedReq.createdAt).toLocaleDateString()}</span>
                </div>

                {selectedReq.status === "pending" && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label>Review Comment (optional)</Label>
                      <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Add a note about this payment..." />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => handleAction(selectedReq.id, "approved")} disabled={actionLoading}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve & Activate
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => handleAction(selectedReq.id, "rejected")} disabled={actionLoading}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                )}

                {selectedReq.reviewerComment && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Review Comment:</p>
                    <p className="text-sm">{selectedReq.reviewerComment}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;