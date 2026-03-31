import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Pencil, Trash2, Users, UserPlus, CreditCard,
  Kaaba, Package, Eye, Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──
type PackageType = "hajj" | "umrah";
type PackageStatus = "active" | "closed" | "upcoming";
type PilgrimStatus = "pending" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "partial" | "paid";

interface HajjPackage {
  id: string;
  name: string;
  type: PackageType;
  price: number;
  duration: string;
  capacity: number;
  status: PackageStatus;
  highlights: string;
  createdAt: string;
}

interface Group {
  id: string;
  packageId: string;
  name: string;
  leader: string;
  leaderPhone: string;
  departureDate: string;
  returnDate: string;
  createdAt: string;
}

interface Pilgrim {
  id: string;
  packageId: string;
  groupId: string;
  name: string;
  phone: string;
  passportNo: string;
  nidNo: string;
  emergencyContact: string;
  status: PilgrimStatus;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

interface PilgrimPayment {
  id: string;
  pilgrimId: string;
  amount: number;
  method: "cash" | "bank" | "bkash";
  date: string;
  note: string;
}

// ── Status Colors ──
const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

// ── Mock Data ──
const defaultPackages: HajjPackage[] = [
  { id: "hp1", name: "Hajj Economy 2026", type: "hajj", price: 550000, duration: "40 Days", capacity: 50, status: "active", highlights: "3-Star Hotel, Shared Room, Meals Included", createdAt: "2026-01-10" },
  { id: "hp2", name: "Hajj Premium 2026", type: "hajj", price: 850000, duration: "35 Days", capacity: 30, status: "active", highlights: "5-Star Hotel, Private Room, VIP Transport", createdAt: "2026-01-10" },
  { id: "hp3", name: "Umrah Ramadan 2026", type: "umrah", price: 180000, duration: "15 Days", capacity: 40, status: "upcoming", highlights: "4-Star Hotel, Iftar, Ziyarat Tour", createdAt: "2026-02-01" },
];

const defaultGroups: Group[] = [
  { id: "g1", packageId: "hp1", name: "Batch-1 (Jan 2026)", leader: "Maulana Rafiq", leaderPhone: "01711-000111", departureDate: "2026-05-20", returnDate: "2026-06-28", createdAt: "2026-01-15" },
  { id: "g2", packageId: "hp1", name: "Batch-2 (Feb 2026)", leader: "Hafez Karim", leaderPhone: "01811-000222", departureDate: "2026-05-22", returnDate: "2026-06-30", createdAt: "2026-02-01" },
  { id: "g3", packageId: "hp3", name: "Umrah Group-A", leader: "Imam Hasan", leaderPhone: "01911-000333", departureDate: "2026-03-01", returnDate: "2026-03-15", createdAt: "2026-02-10" },
];

const defaultPilgrims: Pilgrim[] = [
  { id: "p1", packageId: "hp1", groupId: "g1", name: "Abdul Rahman", phone: "01712-111222", passportNo: "A12345678", nidNo: "1990123456789", emergencyContact: "01712-999888", status: "confirmed", totalAmount: 550000, paidAmount: 400000, dueAmount: 150000, paymentStatus: "partial", createdAt: "2026-01-20" },
  { id: "p2", packageId: "hp1", groupId: "g1", name: "Fatima Khatun", phone: "01812-333444", passportNo: "B98765432", nidNo: "1985567891234", emergencyContact: "01812-777666", status: "confirmed", totalAmount: 550000, paidAmount: 550000, dueAmount: 0, paymentStatus: "paid", createdAt: "2026-01-22" },
  { id: "p3", packageId: "hp1", groupId: "g2", name: "Kamal Uddin", phone: "01912-555666", passportNo: "C11223344", nidNo: "1992345678901", emergencyContact: "01912-444333", status: "pending", totalAmount: 550000, paidAmount: 100000, dueAmount: 450000, paymentStatus: "partial", createdAt: "2026-02-05" },
  { id: "p4", packageId: "hp3", groupId: "g3", name: "Halima Begum", phone: "01612-777888", passportNo: "D55667788", nidNo: "1988901234567", emergencyContact: "01612-222111", status: "pending", totalAmount: 180000, paidAmount: 0, dueAmount: 180000, paymentStatus: "unpaid", createdAt: "2026-02-15" },
];

const defaultPayments: PilgrimPayment[] = [
  { id: "pp1", pilgrimId: "p1", amount: 200000, method: "bank", date: "2026-01-20", note: "1st installment" },
  { id: "pp2", pilgrimId: "p1", amount: 200000, method: "bkash", date: "2026-02-15", note: "2nd installment" },
  { id: "pp3", pilgrimId: "p2", amount: 550000, method: "bank", date: "2026-01-22", note: "Full payment" },
  { id: "pp4", pilgrimId: "p3", amount: 100000, method: "cash", date: "2026-02-05", note: "Booking amount" },
];

// ── Empty Forms ──
const emptyPkgForm = { name: "", type: "hajj" as PackageType, price: 0, duration: "", capacity: 0, status: "upcoming" as PackageStatus, highlights: "" };
const emptyGroupForm = { packageId: "", name: "", leader: "", leaderPhone: "", departureDate: "", returnDate: "" };
const emptyPilgrimForm = { packageId: "", groupId: "", name: "", phone: "", passportNo: "", nidNo: "", emergencyContact: "", status: "pending" as PilgrimStatus };
const emptyPayForm = { pilgrimId: "", amount: 0, method: "cash" as "cash" | "bank" | "bkash", date: new Date().toISOString().split("T")[0], note: "" };

// ══════════════════════════════════════
const HajjUmrah = () => {
  const { toast } = useToast();

  // State
  const [packages, setPackages] = useState<HajjPackage[]>(defaultPackages);
  const [groups, setGroups] = useState<Group[]>(defaultGroups);
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>(defaultPilgrims);
  const [payments, setPayments] = useState<PilgrimPayment[]>(defaultPayments);

  // Dialogs
  const [pkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [pilgrimDialogOpen, setPilgrimDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payHistoryOpen, setPayHistoryOpen] = useState(false);

  // Forms
  const [pkgForm, setPkgForm] = useState(emptyPkgForm);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [pilgrimForm, setPilgrimForm] = useState(emptyPilgrimForm);
  const [payForm, setPayForm] = useState(emptyPayForm);

  // Edit state
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // View state
  const [selectedPilgrimId, setSelectedPilgrimId] = useState<string | null>(null);
  const [searchPilgrim, setSearchPilgrim] = useState("");

  // Summary
  const summary = useMemo(() => {
    const totalPilgrims = pilgrims.length;
    const totalRevenue = pilgrims.reduce((s, p) => s + p.totalAmount, 0);
    const totalCollected = pilgrims.reduce((s, p) => s + p.paidAmount, 0);
    const totalDue = pilgrims.reduce((s, p) => s + p.dueAmount, 0);
    return { totalPilgrims, totalRevenue, totalCollected, totalDue };
  }, [pilgrims]);

  // ── Package Handlers ──
  const handlePkgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkgId) {
      setPackages((prev) => prev.map((p) => p.id === editingPkgId ? { ...p, ...pkgForm } : p));
      toast({ title: "প্যাকেজ আপডেট হয়েছে" });
    } else {
      setPackages((prev) => [...prev, { ...pkgForm, id: crypto.randomUUID(), createdAt: new Date().toISOString().split("T")[0] }]);
      toast({ title: "প্যাকেজ তৈরি হয়েছে" });
    }
    setPkgForm(emptyPkgForm);
    setEditingPkgId(null);
    setPkgDialogOpen(false);
  };

  const editPkg = (pkg: HajjPackage) => {
    setPkgForm({ name: pkg.name, type: pkg.type, price: pkg.price, duration: pkg.duration, capacity: pkg.capacity, status: pkg.status, highlights: pkg.highlights });
    setEditingPkgId(pkg.id);
    setPkgDialogOpen(true);
  };

  // ── Group Handlers ──
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroupId) {
      setGroups((prev) => prev.map((g) => g.id === editingGroupId ? { ...g, ...groupForm } : g));
      toast({ title: "গ্রুপ আপডেট হয়েছে" });
    } else {
      setGroups((prev) => [...prev, { ...groupForm, id: crypto.randomUUID(), createdAt: new Date().toISOString().split("T")[0] }]);
      toast({ title: "গ্রুপ তৈরি হয়েছে" });
    }
    setGroupForm(emptyGroupForm);
    setEditingGroupId(null);
    setGroupDialogOpen(false);
  };

  const editGroup = (g: Group) => {
    setGroupForm({ packageId: g.packageId, name: g.name, leader: g.leader, leaderPhone: g.leaderPhone, departureDate: g.departureDate, returnDate: g.returnDate });
    setEditingGroupId(g.id);
    setGroupDialogOpen(true);
  };

  // ── Pilgrim Handlers ──
  const handlePilgrimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = packages.find((p) => p.id === pilgrimForm.packageId);
    const totalAmount = pkg?.price || 0;
    const newPilgrim: Pilgrim = {
      ...pilgrimForm,
      id: crypto.randomUUID(),
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPilgrims((prev) => [...prev, newPilgrim]);
    toast({ title: "যাত্রী যুক্ত হয়েছে", description: pilgrimForm.name });
    setPilgrimForm(emptyPilgrimForm);
    setPilgrimDialogOpen(false);
  };

  // ── Payment Handlers ──
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pilgrim = pilgrims.find((p) => p.id === payForm.pilgrimId);
    if (!pilgrim) return;
    if (payForm.amount <= 0 || payForm.amount > pilgrim.dueAmount) {
      toast({ title: "ভুল পরিমাণ", description: `সর্বোচ্চ ৳${pilgrim.dueAmount.toLocaleString()} দেওয়া যাবে`, variant: "destructive" });
      return;
    }

    setPayments((prev) => [...prev, { ...payForm, id: crypto.randomUUID() }]);
    const newPaid = pilgrim.paidAmount + payForm.amount;
    const newDue = pilgrim.totalAmount - newPaid;
    const newPayStatus: PaymentStatus = newDue <= 0 ? "paid" : "partial";
    setPilgrims((prev) => prev.map((p) => p.id === payForm.pilgrimId ? { ...p, paidAmount: newPaid, dueAmount: newDue, paymentStatus: newPayStatus } : p));

    toast({ title: "পেমেন্ট রেকর্ড হয়েছে", description: `৳${payForm.amount.toLocaleString()} — ${pilgrim.name}` });
    setPayForm(emptyPayForm);
    setPayDialogOpen(false);
  };

  // Helpers
  const getPkgName = (id: string) => packages.find((p) => p.id === id)?.name || "—";
  const getGroupName = (id: string) => groups.find((g) => g.id === id)?.name || "—";
  const getPilgrimCountForGroup = (groupId: string) => pilgrims.filter((p) => p.groupId === groupId).length;
  const getPilgrimCountForPkg = (pkgId: string) => pilgrims.filter((p) => p.packageId === pkgId).length;

  const filteredPilgrims = useMemo(() => {
    if (!searchPilgrim) return pilgrims;
    const q = searchPilgrim.toLowerCase();
    return pilgrims.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.passportNo.toLowerCase().includes(q));
  }, [pilgrims, searchPilgrim]);

  const selectedPilgrimPayments = useMemo(() => {
    if (!selectedPilgrimId) return [];
    return payments.filter((p) => p.pilgrimId === selectedPilgrimId);
  }, [payments, selectedPilgrimId]);

  // Groups filtered for pilgrim form
  const groupsForPilgrimForm = useMemo(() => {
    if (!pilgrimForm.packageId) return [];
    return groups.filter((g) => g.packageId === pilgrimForm.packageId);
  }, [groups, pilgrimForm.packageId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hajj & Umrah</h1>
          <p className="text-muted-foreground">প্যাকেজ, গ্রুপ, যাত্রী এবং পেমেন্ট ম্যানেজমেন্ট</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">মোট যাত্রী</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{summary.totalPilgrims}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">মোট রেভিনিউ</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">৳{summary.totalRevenue.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">কালেক্টেড</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">৳{summary.totalCollected.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">বাকি</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-destructive">৳{summary.totalDue.toLocaleString()}</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="packages" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="pilgrims">Pilgrims</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* ═══ PACKAGES TAB ═══ */}
          <TabsContent value="packages" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={pkgDialogOpen} onOpenChange={(v) => { setPkgDialogOpen(v); if (!v) { setPkgForm(emptyPkgForm); setEditingPkgId(null); } }}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />New Package</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingPkgId ? "Edit" : "Create"} Package</DialogTitle></DialogHeader>
                  <form onSubmit={handlePkgSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Package Name</Label>
                        <Input value={pkgForm.name} onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))} required maxLength={100} />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={pkgForm.type} onValueChange={(v) => setPkgForm((f) => ({ ...f, type: v as PackageType }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hajj">Hajj</SelectItem>
                            <SelectItem value="umrah">Umrah</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Price (৳)</Label>
                        <Input type="number" min={0} value={pkgForm.price} onChange={(e) => setPkgForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input placeholder="e.g. 40 Days" value={pkgForm.duration} onChange={(e) => setPkgForm((f) => ({ ...f, duration: e.target.value }))} required maxLength={50} />
                      </div>
                      <div className="space-y-2">
                        <Label>Capacity</Label>
                        <Input type="number" min={1} value={pkgForm.capacity} onChange={(e) => setPkgForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={pkgForm.status} onValueChange={(v) => setPkgForm((f) => ({ ...f, status: v as PackageStatus }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Highlights (comma-separated)</Label>
                      <Input value={pkgForm.highlights} onChange={(e) => setPkgForm((f) => ({ ...f, highlights: e.target.value }))} placeholder="5-Star Hotel, Meals, Transport" maxLength={500} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">{editingPkgId ? "Update" : "Create"}</Button>
                      <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={statusColors[pkg.status] || ""} >{pkg.status}</Badge>
                      <Badge variant="outline" className="capitalize">{pkg.type}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.duration} • Capacity: {pkg.capacity}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-xs text-muted-foreground mb-3">{pkg.highlights}</p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <span className="text-xl font-bold text-primary">৳{pkg.price.toLocaleString()}</span>
                        <p className="text-xs text-muted-foreground">{getPilgrimCountForPkg(pkg.id)}/{pkg.capacity} booked</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => editPkg(pkg)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setPackages((p) => p.filter((x) => x.id !== pkg.id)); toast({ title: "প্যাকেজ ডিলিট হয়েছে" }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ═══ GROUPS TAB ═══ */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={groupDialogOpen} onOpenChange={(v) => { setGroupDialogOpen(v); if (!v) { setGroupForm(emptyGroupForm); setEditingGroupId(null); } }}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />New Group</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingGroupId ? "Edit" : "Create"} Group / Batch</DialogTitle></DialogHeader>
                  <form onSubmit={handleGroupSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Package</Label>
                      <Select value={groupForm.packageId} onValueChange={(v) => setGroupForm((f) => ({ ...f, packageId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                        <SelectContent>
                          {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Group / Batch Name</Label>
                      <Input value={groupForm.name} onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))} required maxLength={100} placeholder="e.g. Batch-1 (May 2026)" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Group Leader</Label>
                        <Input value={groupForm.leader} onChange={(e) => setGroupForm((f) => ({ ...f, leader: e.target.value }))} required maxLength={100} />
                      </div>
                      <div className="space-y-2">
                        <Label>Leader Phone</Label>
                        <Input value={groupForm.leaderPhone} onChange={(e) => setGroupForm((f) => ({ ...f, leaderPhone: e.target.value }))} maxLength={20} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Departure Date</Label>
                        <Input type="date" value={groupForm.departureDate} onChange={(e) => setGroupForm((f) => ({ ...f, departureDate: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Return Date</Label>
                        <Input type="date" value={groupForm.returnDate} onChange={(e) => setGroupForm((f) => ({ ...f, returnDate: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">{editingGroupId ? "Update" : "Create"}</Button>
                      <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader><CardTitle>Groups / Batches</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead className="text-center">Pilgrims</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell><Badge variant="secondary">{getPkgName(g.packageId)}</Badge></TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{g.leader}</p>
                            <p className="text-xs text-muted-foreground">{g.leaderPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{g.departureDate}</TableCell>
                        <TableCell className="text-sm">{g.returnDate}</TableCell>
                        <TableCell className="text-center font-semibold">{getPilgrimCountForGroup(g.id)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => editGroup(g)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setGroups((prev) => prev.filter((x) => x.id !== g.id)); toast({ title: "গ্রুপ ডিলিট হয়েছে" }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PILGRIMS TAB ═══ */}
          <TabsContent value="pilgrims" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name, phone, passport…" value={searchPilgrim} onChange={(e) => setSearchPilgrim(e.target.value)} />
              </div>
              <Dialog open={pilgrimDialogOpen} onOpenChange={(v) => { setPilgrimDialogOpen(v); if (!v) setPilgrimForm(emptyPilgrimForm); }}>
                <DialogTrigger asChild>
                  <Button><UserPlus className="mr-2 h-4 w-4" />Add Pilgrim</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>নতুন যাত্রী যুক্ত করুন</DialogTitle></DialogHeader>
                  <form onSubmit={handlePilgrimSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Package</Label>
                        <Select value={pilgrimForm.packageId} onValueChange={(v) => setPilgrimForm((f) => ({ ...f, packageId: v, groupId: "" }))}>
                          <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                          <SelectContent>
                            {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Group</Label>
                        <Select value={pilgrimForm.groupId} onValueChange={(v) => setPilgrimForm((f) => ({ ...f, groupId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                          <SelectContent>
                            {groupsForPilgrimForm.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={pilgrimForm.name} onChange={(e) => setPilgrimForm((f) => ({ ...f, name: e.target.value }))} required maxLength={100} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={pilgrimForm.phone} onChange={(e) => setPilgrimForm((f) => ({ ...f, phone: e.target.value }))} required maxLength={20} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Passport No</Label>
                        <Input value={pilgrimForm.passportNo} onChange={(e) => setPilgrimForm((f) => ({ ...f, passportNo: e.target.value }))} required maxLength={20} />
                      </div>
                      <div className="space-y-2">
                        <Label>NID No</Label>
                        <Input value={pilgrimForm.nidNo} onChange={(e) => setPilgrimForm((f) => ({ ...f, nidNo: e.target.value }))} maxLength={20} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Contact</Label>
                      <Input value={pilgrimForm.emergencyContact} onChange={(e) => setPilgrimForm((f) => ({ ...f, emergencyContact: e.target.value }))} maxLength={20} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1"><UserPlus className="mr-2 h-4 w-4" />Add Pilgrim</Button>
                      <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader><CardTitle>Pilgrim List ({filteredPilgrims.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Passport</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPilgrims.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{getPkgName(p.packageId)}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{getGroupName(p.groupId)}</TableCell>
                        <TableCell className="font-mono text-xs">{p.passportNo}</TableCell>
                        <TableCell><Badge className={statusColors[p.status] || ""}>{p.status}</Badge></TableCell>
                        <TableCell className="text-right">৳{p.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600">৳{p.paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">৳{p.dueAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="min-w-[80px]">
                            <Progress value={p.totalAmount > 0 ? (p.paidAmount / p.totalAmount) * 100 : 0} className="h-2" />
                            <Badge variant="outline" className={`text-xs mt-1 ${statusColors[p.paymentStatus] || ""}`}>{p.paymentStatus}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Add Payment" onClick={() => { setPayForm({ ...emptyPayForm, pilgrimId: p.id }); setPayDialogOpen(true); }}>
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Payment History" onClick={() => { setSelectedPilgrimId(p.id); setPayHistoryOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PAYMENTS TAB ═══ */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Payments ({payments.length})</CardTitle>
                <CardDescription>সকল যাত্রীদের পেমেন্ট রেকর্ড</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pilgrim</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...payments].reverse().map((pay) => {
                      const pilgrim = pilgrims.find((p) => p.id === pay.pilgrimId);
                      return (
                        <TableRow key={pay.id}>
                          <TableCell className="text-sm">{pay.date}</TableCell>
                          <TableCell className="font-medium">{pilgrim?.name || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{pay.method}</Badge></TableCell>
                          <TableCell className="text-right font-semibold text-green-600">৳{pay.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{pay.note}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Add Payment Dialog ── */}
        <Dialog open={payDialogOpen} onOpenChange={(v) => { setPayDialogOpen(v); if (!v) setPayForm(emptyPayForm); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>পেমেন্ট যুক্ত করুন</DialogTitle></DialogHeader>
            {payForm.pilgrimId && (() => {
              const p = pilgrims.find((x) => x.id === payForm.pilgrimId);
              if (!p) return null;
              return (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 mb-2">
                  <p><strong>{p.name}</strong></p>
                  <p>Total: ৳{p.totalAmount.toLocaleString()} • Paid: ৳{p.paidAmount.toLocaleString()} • <span className="text-destructive font-semibold">Due: ৳{p.dueAmount.toLocaleString()}</span></p>
                </div>
              );
            })()}
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (৳)</Label>
                  <Input type="number" min={1} value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v as "cash" | "bank" | "bkash" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="bkash">bKash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={payForm.date} onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input value={payForm.note} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. 1st installment" maxLength={200} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1"><CreditCard className="mr-2 h-4 w-4" />Record Payment</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Payment History Dialog ── */}
        <Dialog open={payHistoryOpen} onOpenChange={setPayHistoryOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Payment History</DialogTitle></DialogHeader>
            {selectedPilgrimId && (() => {
              const p = pilgrims.find((x) => x.id === selectedPilgrimId);
              if (!p) return null;
              return (
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                    <p className="font-medium">{p.name}</p>
                    <div className="flex justify-between">
                      <span>Total: ৳{p.totalAmount.toLocaleString()}</span>
                      <span className="text-green-600">Paid: ৳{p.paidAmount.toLocaleString()}</span>
                      <span className="text-destructive">Due: ৳{p.dueAmount.toLocaleString()}</span>
                    </div>
                    <Progress value={(p.paidAmount / p.totalAmount) * 100} className="h-2 mt-2" />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPilgrimPayments.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No payments yet</TableCell></TableRow>
                      ) : selectedPilgrimPayments.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell>{pay.date}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{pay.method}</Badge></TableCell>
                          <TableCell className="text-right font-semibold text-green-600">৳{pay.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{pay.note}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
            <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default HajjUmrah;
