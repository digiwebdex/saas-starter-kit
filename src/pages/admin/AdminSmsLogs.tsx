import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  MessageSquare, Send, Loader2, Search, CheckCircle2, XCircle, Clock,
  RefreshCw, Phone, BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smsApi, type SmsLog, type SmsLogStatus, type SmsLogFilters } from "@/lib/smsApi";

const STATUS_CONFIG: Record<SmsLogStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  sent: { label: "Sent", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  failed: { label: "Failed", icon: XCircle, className: "bg-destructive/15 text-destructive" },
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
};

const AdminSmsLogs = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState<SmsLogFilters>({ page: 1, limit: 20 });
  const [searchPhone, setSearchPhone] = useState("");
  const [sendForm, setSendForm] = useState({ phone: "", message: "" });
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        smsApi.getLogs(filters),
        smsApi.getLogStats(),
      ]);
      setLogs(logsRes.logs);
      setTotal(logsRes.total);
      setStats(statsRes);
    } catch {
      // Demo fallback
      const demoLogs: SmsLog[] = [
        { id: "1", phone: "+8801712345678", message: "Dear John, your tour booking (BK-001) is confirmed. Amount: 25000 BDT.", status: "sent", provider: "sslwireless", sentAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        { id: "2", phone: "+8801898765432", message: "Dear Sarah, we received your payment of 15000 BDT for Invoice #INV-042.", status: "sent", provider: "sslwireless", sentAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        { id: "3", phone: "+8801555000111", message: "Your verification code is 482913. Valid for 5 minutes.", status: "failed", provider: "bulksms", errorMessage: "Invalid phone number", sentAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        { id: "4", phone: "+8801612340000", message: "Dear Ali, a payment of 8000 BDT for Invoice #INV-051 is due on 2025-04-15.", status: "pending", provider: "sslwireless", sentAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      ];
      setLogs(demoLogs);
      setTotal(demoLogs.length);
      setStats({ total: 4, sent: 2, failed: 1, pending: 1 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSend = async () => {
    if (!sendForm.phone.trim() || !sendForm.message.trim()) {
      toast({ title: "Phone and message are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await smsApi.send({ phone: sendForm.phone, message: sendForm.message });
      if (res.success) {
        toast({ title: "SMS sent successfully" });
      } else {
        toast({ title: "SMS failed", description: res.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Failed to send SMS", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
      setSendOpen(false);
      setSendForm({ phone: "", message: "" });
      fetchData();
    }
  };

  const handleSearch = () => {
    setFilters((f) => ({ ...f, phone: searchPhone || undefined, page: 1 }));
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-8 w-8" /> SMS Logs
            </h1>
            <p className="text-muted-foreground">Send SMS messages and view delivery logs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setSendOpen(true)}>
              <Send className="mr-2 h-4 w-4" /> Send SMS
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Sent", value: stats.total, icon: BarChart3, color: "text-primary" },
            { label: "Delivered", value: stats.sent, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Failed", value: stats.failed, icon: XCircle, color: "text-destructive" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "all" ? undefined : v as SmsLogStatus, page: 1 }))}
          >
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No SMS logs found</p>
                <p className="text-sm">Send your first SMS to see logs here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Error</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const cfg = STATUS_CONFIG[log.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[280px]">
                          <p className="text-sm text-muted-foreground truncate">{log.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{log.provider}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`gap-1 ${cfg.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[200px]">
                          {log.errorMessage ? (
                            <p className="text-xs text-destructive truncate">{log.errorMessage}</p>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {filters.page} of {totalPages} · {total} total logs
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={(filters.page || 1) <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={(filters.page || 1) >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Send SMS Dialog */}
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send SMS</DialogTitle>
              <DialogDescription>Send a single SMS message to a phone number.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+8801XXXXXXXXX"
                  value={sendForm.phone}
                  onChange={(e) => setSendForm({ ...sendForm, phone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g. +880)</p>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  rows={4}
                  placeholder="Type your message..."
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{sendForm.message.length} characters</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending || !sendForm.phone || !sendForm.message}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSmsLogs;
