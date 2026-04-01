import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Bell, RefreshCw, Download, Eye, Mail, MessageSquare,
  CheckCircle, XCircle, Clock, Settings, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getDeliveryLog, getDeliveryStats, seedDeliveryLog, retryDelivery,
  EVENT_CONFIGS, type NotificationDelivery, type NotificationEventType,
  type NotificationChannel, type DeliveryStatus,
} from "@/lib/notificationEngine";

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  sent: { label: "Sent", icon: CheckCircle, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  failed: { label: "Failed", icon: XCircle, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  retrying: { label: "Retrying", icon: RotateCcw, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
};

const EVENT_LABELS: Record<NotificationEventType, string> = {
  lead_assigned: "Lead Assigned",
  quotation_sent: "Quotation Sent",
  quotation_approved: "Quotation Approved",
  booking_confirmed: "Booking Confirmed",
  payment_received: "Payment Received",
  payment_overdue: "Payment Overdue",
  subscription_expiring: "Subscription Expiring",
};

const NotificationLog = () => {
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState<NotificationDelivery | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [eventConfigs, setEventConfigs] = useState(EVENT_CONFIGS.map((e) => ({ ...e })));
  const { toast } = useToast();

  useEffect(() => {
    seedDeliveryLog();
    setDeliveries(getDeliveryLog());
  }, []);

  const stats = useMemo(() => getDeliveryStats(), [deliveries]);

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      const matchSearch = search === "" ||
        d.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        d.recipient.toLowerCase().includes(search.toLowerCase()) ||
        d.message.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      const matchChannel = channelFilter === "all" || d.channel === channelFilter;
      const matchEvent = eventFilter === "all" || d.eventType === eventFilter;
      return matchSearch && matchStatus && matchChannel && matchEvent;
    });
  }, [deliveries, search, statusFilter, channelFilter, eventFilter]);

  const handleRetry = async (id: string) => {
    const result = await retryDelivery(id);
    if (result) {
      setDeliveries([...getDeliveryLog()]);
      toast({ title: result.status === "sent" ? "✅ Retry successful" : "❌ Retry failed", description: result.failureReason || "Notification sent successfully" });
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Event", "Channel", "Recipient", "Name", "Status", "Message", "Attempts", "Failure Reason"];
    const rows = filtered.map((d) => [d.createdAt, EVENT_LABELS[d.eventType], d.channel, d.recipient, d.recipientName, d.status, d.message, d.attempts, d.failureReason || ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "notification-log.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Log</h1>
            <p className="text-muted-foreground">SMS and email notification delivery history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}><Settings className="mr-1 h-4 w-4" /> Configure</Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Bell className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{stats.sent}</p><p className="text-xs text-muted-foreground">Sent</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-red-500" /><div><p className="text-2xl font-bold">{stats.failed}</p><p className="text-xs text-muted-foreground">Failed</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><MessageSquare className="h-8 w-8 text-pink-500" /><div><p className="text-2xl font-bold">{stats.bySms}</p><p className="text-xs text-muted-foreground">SMS</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{stats.byEmail}</p><p className="text-xs text-muted-foreground">Email</p></div></div></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search recipient, message…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Event" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {Object.entries(EVENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Channel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="retrying">Retrying</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Delivery History ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="hidden md:table-cell">Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No notifications found.</TableCell></TableRow>
                ) : (
                  filtered.map((d) => {
                    const cfg = STATUS_CONFIG[d.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{EVENT_LABELS[d.eventType]}</Badge>
                        </TableCell>
                        <TableCell>
                          {d.channel === "sms" ? <MessageSquare className="h-4 w-4 text-pink-500" /> : <Mail className="h-4 w-4 text-blue-500" />}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{d.recipientName}</p>
                            <p className="text-[10px] text-muted-foreground">{d.recipient}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[250px]">
                          <p className="text-xs text-muted-foreground truncate">{d.message}</p>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                            <StatusIcon className="h-3 w-3" />{cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm">{d.attempts}/{d.maxAttempts}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedDelivery(d); setDetailOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {d.status === "failed" && d.attempts < d.maxAttempts && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Retry" onClick={() => handleRetry(d.id)}>
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Notification Details</DialogTitle></DialogHeader>
            {selectedDelivery && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <span className="text-muted-foreground">Event:</span>
                  <Badge variant="outline" className="w-fit">{EVENT_LABELS[selectedDelivery.eventType]}</Badge>
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="capitalize">{selectedDelivery.channel}</span>
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-medium">{selectedDelivery.recipientName}</span>
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono text-xs">{selectedDelivery.recipient}</span>
                  <span className="text-muted-foreground">Status:</span>
                  {(() => { const cfg = STATUS_CONFIG[selectedDelivery.status]; return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit ${cfg.className}`}>{cfg.label}</span>; })()}
                  <span className="text-muted-foreground">Attempts:</span>
                  <span>{selectedDelivery.attempts} / {selectedDelivery.maxAttempts}</span>
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(selectedDelivery.createdAt).toLocaleString()}</span>
                  {selectedDelivery.sentAt && (<><span className="text-muted-foreground">Sent At:</span><span>{new Date(selectedDelivery.sentAt).toLocaleString()}</span></>)}
                  {selectedDelivery.failureReason && (<><span className="text-muted-foreground">Failure Reason:</span><span className="text-destructive text-xs">{selectedDelivery.failureReason}</span></>)}
                  <span className="text-muted-foreground">Tenant:</span>
                  <span>{selectedDelivery.tenantName}</span>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs font-medium mb-1">Message</p>
                  <p className="text-sm">{selectedDelivery.message}</p>
                </div>
                {selectedDelivery.status === "failed" && selectedDelivery.attempts < selectedDelivery.maxAttempts && (
                  <Button className="w-full" onClick={() => { handleRetry(selectedDelivery.id); setDetailOpen(false); }}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry Notification
                  </Button>
                )}
              </div>
            )}
            <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
          </DialogContent>
        </Dialog>

        {/* Config Dialog */}
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Notification Configuration</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Enable or disable notification channels per event type.</p>
            <div className="space-y-4 py-2">
              {eventConfigs.map((config, i) => (
                <div key={config.type} className="rounded-md border p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.channels.sms}
                        onCheckedChange={(v) => {
                          const updated = [...eventConfigs];
                          updated[i] = { ...updated[i], channels: { ...updated[i].channels, sms: v } };
                          setEventConfigs(updated);
                        }}
                      />
                      <Label className="text-xs">SMS</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.channels.email}
                        onCheckedChange={(v) => {
                          const updated = [...eventConfigs];
                          updated[i] = { ...updated[i], channels: { ...updated[i].channels, email: v } };
                          setEventConfigs(updated);
                        }}
                      />
                      <Label className="text-xs">Email</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => { setConfigOpen(false); toast({ title: "✅ Configuration saved" }); }}>Save Configuration</Button>
            <DialogClose asChild><Button variant="outline" className="w-full">Cancel</Button></DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default NotificationLog;
