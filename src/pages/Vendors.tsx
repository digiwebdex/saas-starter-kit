import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import PermissionGate from "@/components/PermissionGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus, Store, Search, Download, Eye, Pencil, Building2,
  Plane, Car, CreditCard, MapPin, Globe, Users, AlertTriangle,
  CheckCircle2, Clock, XCircle, Filter, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  vendorApi, type Vendor, type VendorCategory, type VendorBill, type VendorBillStatus,
} from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

const CATEGORIES: { value: VendorCategory; label: string; icon: any }[] = [
  { value: "hotel", label: "Hotel", icon: Building2 },
  { value: "airline", label: "Airline", icon: Plane },
  { value: "transport", label: "Transport", icon: Car },
  { value: "visa_partner", label: "Visa Partner", icon: Globe },
  { value: "guide", label: "Guide", icon: Users },
  { value: "tour_operator", label: "Tour Operator", icon: MapPin },
  { value: "other", label: "Other", icon: Store },
];

const BILL_STATUS_META: { value: VendorBillStatus; label: string; color: string }[] = [
  { value: "unpaid", label: "Unpaid", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "partial", label: "Partially Paid", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "overdue", label: "Overdue", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
];

const getCategoryMeta = (c: VendorCategory) => CATEGORIES.find((x) => x.value === c) || CATEGORIES[6];
const getBillStatusMeta = (s: VendorBillStatus) => BILL_STATUS_META.find((x) => x.value === s) || BILL_STATUS_META[0];

const Vendors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [payables, setPayables] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("vendors");

  // Payable filters
  const [payableStatus, setPayableStatus] = useState("all");
  const [payableSearch, setPayableSearch] = useState("");

  // Form
  const emptyForm = {
    name: "", phone: "", email: "", category: "hotel" as VendorCategory,
    contactPerson: "", address: "", serviceAreas: "", website: "",
    bankDetails: "", notes: "", status: "active" as "active" | "inactive",
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vList, pList] = await Promise.all([
        vendorApi.list(),
        vendorApi.getPayableReport().catch(() => []),
      ]);
      setVendors(vList);
      setPayables(pList);
    } catch (err: any) {
      setError(err.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Create / Update ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editVendor) {
        const updated = await vendorApi.update(editVendor.id, form as any);
        setVendors((prev) => prev.map((v) => v.id === editVendor.id ? { ...v, ...updated } : v));
        toast({ title: "Vendor updated" });
      } else {
        const created = await vendorApi.create(form as any);
        setVendors((prev) => [...prev, created]);
        toast({ title: "Vendor created" });
      }
      setForm(emptyForm);
      setEditVendor(null);
      setCreateOpen(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (v: Vendor) => {
    setForm({
      name: v.name, phone: v.phone, email: v.email,
      category: v.category || "other",
      contactPerson: v.contactPerson || "", address: v.address || "",
      serviceAreas: v.serviceAreas || "", website: v.website || "",
      bankDetails: v.bankDetails || "", notes: v.notes || "",
      status: v.status || "active",
    });
    setEditVendor(v);
    setCreateOpen(true);
  };

  // ── Filters ──
  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch = !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.email?.toLowerCase().includes(search.toLowerCase()) ||
        v.contactPerson?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || v.category === categoryFilter;
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [vendors, search, categoryFilter, statusFilter]);

  const filteredPayables = useMemo(() => {
    return payables.filter((b) => {
      const matchSearch = !payableSearch ||
        b.vendorName?.toLowerCase().includes(payableSearch.toLowerCase()) ||
        b.description?.toLowerCase().includes(payableSearch.toLowerCase()) ||
        b.bookingTitle?.toLowerCase().includes(payableSearch.toLowerCase());
      const matchStatus = payableStatus === "all" || b.status === payableStatus;
      return matchSearch && matchStatus;
    });
  }, [payables, payableSearch, payableStatus]);

  // ── Totals ──
  const totals = useMemo(() => {
    const total = payables.reduce((s, b) => s + b.totalAmount, 0);
    const paid = payables.reduce((s, b) => s + b.paidAmount, 0);
    const due = payables.reduce((s, b) => s + b.dueAmount, 0);
    const overdueCount = payables.filter((b) => b.status === "overdue").length;
    return { total, paid, due, overdueCount };
  }, [payables]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((c) => { counts[c.value] = vendors.filter((v) => v.category === c.value).length; });
    return counts;
  }, [vendors]);

  // ── Export ──
  const handleExport = () => {
    const data = activeTab === "vendors" ? filtered : filteredPayables;
    if (!data.length) return;
    let csv: string;
    if (activeTab === "vendors") {
      const headers = ["Name", "Category", "Contact Person", "Phone", "Email", "Status"];
      const rows = (data as Vendor[]).map((v) => [v.name, v.category, v.contactPerson || "", v.phone, v.email, v.status]);
      csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    } else {
      const headers = ["Vendor", "Booking", "Description", "Total", "Paid", "Due", "Status", "Due Date"];
      const rows = (data as VendorBill[]).map((b) => [
        b.vendorName || "", b.bookingTitle || "", b.description,
        b.totalAmount.toString(), b.paidAmount.toString(), b.dueAmount.toString(),
        b.status, b.dueDate || "",
      ]);
      csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${activeTab}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: `Exported ${activeTab}` });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Store className="h-8 w-8" /> Vendors & Suppliers
            </h1>
            <p className="text-muted-foreground">Manage suppliers, track vendor bills, and monitor payable settlements</p>
          </div>
          <div className="flex gap-2">
            <PermissionGate module="vendors" action="export">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1 h-4 w-4" /> Export
              </Button>
            </PermissionGate>
            <PermissionGate module="vendors" action="create">
              <Button onClick={() => { setForm(emptyForm); setEditVendor(null); setCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Vendor
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total Vendors</div>
                <Store className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{vendors.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total Payable</div>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">৳{totals.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Paid</div>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">৳{totals.paid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Outstanding</div>
                <Clock className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-2xl font-bold text-destructive">৳{totals.due.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className={totals.overdueCount > 0 ? "border-orange-300 dark:border-orange-600" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Overdue Bills</div>
                <AlertTriangle className={`h-4 w-4 ${totals.overdueCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              </div>
              <p className="text-2xl font-bold">{totals.overdueCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
            <TabsTrigger value="payables">Payable Report ({payables.length})</TabsTrigger>
          </TabsList>

          {/* ═══ VENDORS TAB ═══ */}
          <TabsContent value="vendors" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search vendor name, email, contact..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="mr-1 h-4 w-4" />
                  Filters
                  {showFilters ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                </Button>
              </div>
              {showFilters && (
                <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label} ({categoryCounts[c.value] || 0})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(categoryFilter !== "all" || statusFilter !== "all") && (
                    <div className="flex items-end">
                      <Button variant="ghost" size="sm" onClick={() => { setCategoryFilter("all"); setStatusFilter("all"); }}>
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vendor Table */}
            {loading ? (
              <LoadingState rows={6} />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchData} />
            ) : vendors.length === 0 ? (
              <EmptyState icon={Store} title="No vendors yet" description="Add your first hotel, airline, or transport supplier to start tracking costs." actionLabel="Add Vendor" onAction={() => setCreateOpen(true)} />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No vendors match your filters.</TableCell></TableRow>
                      ) : (
                        filtered.map((v) => {
                          const catMeta = getCategoryMeta(v.category);
                          return (
                            <TableRow key={v.id} className="cursor-pointer" onClick={() => navigate(`/vendors/${v.id}`)}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <catMeta.icon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <span className="font-medium">{v.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{catMeta.label}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{v.contactPerson || "—"}</TableCell>
                              <TableCell className="text-sm">{v.phone || "—"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{v.email || "—"}</TableCell>
                              <TableCell>
                                <Badge variant={v.status === "active" ? "default" : "secondary"} className="capitalize">
                                  {v.status || "active"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`/vendors/${v.id}`)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <PermissionGate module="vendors" action="edit">
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(v)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </PermissionGate>
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
            )}
          </TabsContent>

          {/* ═══ PAYABLES TAB ═══ */}
          <TabsContent value="payables" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search vendor, booking, description..." value={payableSearch} onChange={(e) => setPayableSearch(e.target.value)} />
              </div>
              <Select value={payableStatus} onValueChange={setPayableStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {BILL_STATUS_META.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredPayables.length === 0 ? (
              <EmptyState icon={CreditCard} title="No payable bills" description="Vendor bills will appear here once created from bookings or vendor profiles." />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayables.map((b) => {
                        const meta = getBillStatusMeta(b.status);
                        return (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.vendorName || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground truncate max-w-[140px]">{b.bookingTitle || "—"}</TableCell>
                            <TableCell className="text-sm truncate max-w-[160px]">{b.description}</TableCell>
                            <TableCell className="text-right font-medium">৳{b.totalAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">৳{b.paidAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-destructive font-semibold">৳{b.dueAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {b.dueDate ? <span className={b.status === "overdue" ? "text-orange-600 font-medium" : ""}>{b.dueDate}</span> : "—"}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* ═══ CREATE / EDIT DIALOG ═══ */}
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setEditVendor(null); setForm(emptyForm); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Grand Hyatt Dhaka" required />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as VendorCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="e.g. Mr. Rahman" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+880 1XXX-XXXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="reservations@hotel.com" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Service Areas / Routes</Label>
                <Input value={form.serviceAreas} onChange={(e) => setForm((f) => ({ ...f, serviceAreas: e.target.value }))} placeholder="e.g. Dhaka, Cox's Bazar, Chittagong" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Full address" />
              </div>
              <div className="space-y-2">
                <Label>Bank / Payment Details</Label>
                <Textarea value={form.bankDetails} onChange={(e) => setForm((f) => ({ ...f, bankDetails: e.target.value }))} placeholder="Bank name, account number, branch, routing..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "active" | "inactive" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Internal notes about this vendor..." rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editVendor ? "Update Vendor" : "Add Vendor"}</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Vendors;
