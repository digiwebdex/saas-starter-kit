import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpCircle, ArrowDownCircle, CalendarPlus, XCircle, Eye, Crown, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanType } from "@/lib/plans";

type SubStatus = "active" | "expired" | "cancelled";

interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  plan: PlanType;
  price: number;
  startDate: string;
  endDate: string;
  status: SubStatus;
}

const mockSubscriptions: TenantSubscription[] = [
  { id: "s1", tenantId: "t1", tenantName: "Acme Travel", ownerEmail: "john@acme.com", plan: "pro", price: 1999, startDate: "2026-03-01", endDate: "2026-04-01", status: "active" },
  { id: "s2", tenantId: "t2", tenantName: "Globe Tours", ownerEmail: "jane@globe.com", plan: "basic", price: 999, startDate: "2026-02-15", endDate: "2026-03-15", status: "expired" },
  { id: "s3", tenantId: "t3", tenantName: "Star Holidays", ownerEmail: "ali@star.com", plan: "free", price: 0, startDate: "2026-01-01", endDate: "", status: "active" },
  { id: "s4", tenantId: "t4", tenantName: "Royal Travels", ownerEmail: "royal@travel.com", plan: "business", price: 4999, startDate: "2026-03-10", endDate: "2026-04-10", status: "active" },
  { id: "s5", tenantId: "t5", tenantName: "Dream Trips", ownerEmail: "dream@trips.com", plan: "pro", price: 1999, startDate: "2026-01-20", endDate: "2026-02-20", status: "cancelled" },
];

const planOrder: PlanType[] = ["free", "basic", "pro", "business", "enterprise"];

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>(mockSubscriptions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubStatus>("all");
  const [planFilter, setPlanFilter] = useState<"all" | PlanType>("all");
  const { toast } = useToast();

  // Action dialog states
  const [actionType, setActionType] = useState<"upgrade" | "downgrade" | "extend" | "cancel" | "view" | null>(null);
  const [selectedSub, setSelectedSub] = useState<TenantSubscription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Action form states
  const [newPlan, setNewPlan] = useState<PlanType>("basic");
  const [extendUnit, setExtendUnit] = useState<"days" | "months">("months");
  const [extendValue, setExtendValue] = useState("1");

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchSearch = s.tenantName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerEmail.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchPlan = planFilter === "all" || s.plan === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [subscriptions, search, statusFilter, planFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    expired: subscriptions.filter((s) => s.status === "expired").length,
    cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
    revenue: subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + s.price, 0),
  }), [subscriptions]);

  const openAction = (sub: TenantSubscription, type: typeof actionType) => {
    setSelectedSub(sub);
    setActionType(type);
    if (type === "upgrade") {
      const idx = planOrder.indexOf(sub.plan);
      setNewPlan(planOrder[Math.min(idx + 1, planOrder.length - 1)]);
    } else if (type === "downgrade") {
      const idx = planOrder.indexOf(sub.plan);
      setNewPlan(planOrder[Math.max(idx - 1, 0)]);
    }
    setExtendValue("1");
    setExtendUnit("months");
    setDialogOpen(true);
  };

  const handleUpgrade = () => {
    if (!selectedSub) return;
    const planInfo = PLANS.find((p) => p.id === newPlan);
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, plan: newPlan, price: planInfo?.price || 0, status: "active" } : s
    ));
    toast({ title: "Plan Upgraded", description: `${selectedSub.tenantName} → ${newPlan.toUpperCase()}` });
    setDialogOpen(false);
  };

  const handleDowngrade = () => {
    if (!selectedSub) return;
    const planInfo = PLANS.find((p) => p.id === newPlan);
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, plan: newPlan, price: planInfo?.price || 0 } : s
    ));
    toast({ title: "Plan Downgraded", description: `${selectedSub.tenantName} → ${newPlan.toUpperCase()}` });
    setDialogOpen(false);
  };

  const handleExtend = () => {
    if (!selectedSub) return;
    const val = parseInt(extendValue) || 1;
    const base = selectedSub.endDate ? new Date(selectedSub.endDate) : new Date();
    if (extendUnit === "months") base.setMonth(base.getMonth() + val);
    else base.setDate(base.getDate() + val);
    const newEnd = base.toISOString().split("T")[0];
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, endDate: newEnd, status: "active" } : s
    ));
    toast({ title: "Subscription Extended", description: `${selectedSub.tenantName} → expires ${newEnd}` });
    setDialogOpen(false);
  };

  const handleCancel = () => {
    if (!selectedSub) return;
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, status: "cancelled" } : s
    ));
    toast({ title: "Subscription Cancelled", description: selectedSub.tenantName, variant: "destructive" });
    setDialogOpen(false);
  };

  const statusBadge = (status: SubStatus) => {
    const map: Record<SubStatus, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      expired: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>{status}</span>;
  };

  const daysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getUpgradePlans = (current: PlanType) => {
    const idx = planOrder.indexOf(current);
    return planOrder.slice(idx + 1).filter((p) => p !== "enterprise");
  };

  const getDowngradePlans = (current: PlanType) => {
    const idx = planOrder.indexOf(current);
    return planOrder.slice(0, idx);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground">View and manage all tenant subscriptions</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">৳{stats.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {PLANS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="capitalize">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No subscriptions found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((sub) => {
                    const days = daysUntilExpiry(sub.endDate);
                    const expiringSoon = days !== null && days > 0 && days <= 7 && sub.status === "active";
                    return (
                      <TableRow key={sub.id} className={sub.status === "cancelled" ? "opacity-60" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.tenantName}</p>
                            <p className="text-xs text-muted-foreground">{sub.ownerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{sub.plan}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {sub.price === 0 ? "Free" : `৳${sub.price.toLocaleString()}/mo`}
                        </TableCell>
                        <TableCell className="text-sm">{sub.startDate}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            {sub.endDate || "—"}
                            {expiringSoon && (
                              <span title={`Expires in ${days} days`}><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /></span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(sub.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="View" onClick={() => openAction(sub, "view")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {sub.status !== "cancelled" && (
                              <>
                                {getUpgradePlans(sub.plan).length > 0 && (
                                  <Button variant="ghost" size="icon" title="Upgrade" onClick={() => openAction(sub, "upgrade")}>
                                    <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                {getDowngradePlans(sub.plan).length > 0 && (
                                  <Button variant="ghost" size="icon" title="Downgrade" onClick={() => openAction(sub, "downgrade")}>
                                    <ArrowDownCircle className="h-4 w-4 text-yellow-600" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" title="Extend" onClick={() => openAction(sub, "extend")}>
                                  <CalendarPlus className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Cancel" onClick={() => openAction(sub, "cancel")}>
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
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

        {/* Action Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setActionType(null); setSelectedSub(null); } }}>
          <DialogContent>
            {selectedSub && actionType === "view" && (
              <>
                <DialogHeader><DialogTitle>Subscription Details</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{selectedSub.tenantName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedSub.ownerEmail}</span>
                  <span className="text-muted-foreground">Plan:</span>
                  <Badge variant="secondary" className="capitalize w-fit">{selectedSub.plan}</Badge>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold">{selectedSub.price === 0 ? "Free" : `৳${selectedSub.price.toLocaleString()}/mo`}</span>
                  <span className="text-muted-foreground">Start:</span>
                  <span>{selectedSub.startDate}</span>
                  <span className="text-muted-foreground">Expiry:</span>
                  <span>{selectedSub.endDate || "N/A"}</span>
                  <span className="text-muted-foreground">Status:</span>
                  {statusBadge(selectedSub.status)}
                  <span className="text-muted-foreground">Tenant ID:</span>
                  <span className="font-mono text-xs">{selectedSub.tenantId}</span>
                </div>
                <DialogClose asChild><Button variant="outline" className="mt-4 w-full">Close</Button></DialogClose>
              </>
            )}

            {selectedSub && actionType === "upgrade" && (
              <>
                <DialogHeader><DialogTitle>Upgrade Plan — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">Current: <Badge variant="secondary" className="capitalize ml-1">{selectedSub.plan}</Badge></p>
                <div className="space-y-2">
                  <Label>New Plan</Label>
                  <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {getUpgradePlans(selectedSub.plan).map((p) => {
                        const info = PLANS.find((pl) => pl.id === p);
                        return <SelectItem key={p} value={p} className="capitalize">{info?.name} — ৳{info?.price?.toLocaleString()}/mo</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" onClick={handleUpgrade}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade
                  </Button>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                </div>
              </>
            )}

            {selectedSub && actionType === "downgrade" && (
              <>
                <DialogHeader><DialogTitle>Downgrade Plan — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">Current: <Badge variant="secondary" className="capitalize ml-1">{selectedSub.plan}</Badge></p>
                <div className="space-y-2">
                  <Label>New Plan</Label>
                  <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {getDowngradePlans(selectedSub.plan).map((p) => {
                        const info = PLANS.find((pl) => pl.id === p);
                        return <SelectItem key={p} value={p} className="capitalize">{info?.name} — {info?.price === 0 ? "Free" : `৳${info?.price?.toLocaleString()}/mo`}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="destructive" className="flex-1" onClick={handleDowngrade}>
                    <ArrowDownCircle className="mr-2 h-4 w-4" /> Downgrade
                  </Button>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                </div>
              </>
            )}

            {selectedSub && actionType === "extend" && (
              <>
                <DialogHeader><DialogTitle>Extend Subscription — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Current expiry: <strong>{selectedSub.endDate || "No expiry"}</strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input type="number" min="1" max="365" value={extendValue} onChange={(e) => setExtendValue(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={extendUnit} onValueChange={(v) => setExtendUnit(v as "days" | "months")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" onClick={handleExtend}>
                    <CalendarPlus className="mr-2 h-4 w-4" /> Extend
                  </Button>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                </div>
              </>
            )}

            {selectedSub && actionType === "cancel" && (
              <>
                <DialogHeader><DialogTitle>Cancel Subscription</DialogTitle></DialogHeader>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <AlertTriangle className="h-5 w-5" />
                    Warning: This action will restrict tenant features
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cancelling <strong>{selectedSub.tenantName}</strong>'s <strong className="capitalize">{selectedSub.plan}</strong> plan will immediately restrict their access to free-tier features only.
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="destructive" className="flex-1" onClick={handleCancel}>
                    <XCircle className="mr-2 h-4 w-4" /> Confirm Cancel
                  </Button>
                  <DialogClose asChild><Button variant="outline">Keep Active</Button></DialogClose>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
