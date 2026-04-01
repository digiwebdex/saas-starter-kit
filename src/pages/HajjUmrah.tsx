import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PermissionGate from "@/components/PermissionGate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Pencil, Trash2, Users, UserPlus, CreditCard, Eye, Search, Download,
  Plane, Hotel, MapPin, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Shield, FileText, Moon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  hajjApi,
  type HajjPackage, type HajjPackageType, type HajjPackageStatus,
  type HajjGroup, type HajjPilgrim, type HajjPilgrimStatus, type HajjVisaStatus,
  type HajjRoomType, type HajjPilgrimPayment,
} from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

// ── Constants ──
const PKG_STATUS_META: { value: HajjPackageStatus; label: string; color: string }[] = [
  { value: "upcoming", label: "Upcoming", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "departed", label: "Departed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "completed", label: "Completed", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  { value: "closed", label: "Closed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const PILGRIM_STATUS_META: { value: HajjPilgrimStatus; label: string; color: string }[] = [
  { value: "registered", label: "Registered", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "documents_pending", label: "Docs Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "visa_processing", label: "Visa Processing", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "departed", label: "Departed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "completed", label: "Completed", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const VISA_STATUS_META: { value: HajjVisaStatus; label: string; color: string }[] = [
  { value: "not_started", label: "Not Started", color: "bg-gray-100 text-gray-800" },
  { value: "documents_collected", label: "Docs Collected", color: "bg-blue-100 text-blue-800" },
  { value: "submitted", label: "Submitted", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
];

const HOTEL_CLASSES = [
  { value: "economy", label: "Economy" },
  { value: "3_star", label: "3-Star" },
  { value: "4_star", label: "4-Star" },
  { value: "5_star", label: "5-Star" },
  { value: "shifting", label: "Shifting" },
];

const ROOM_TYPES: { value: HajjRoomType; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "triple", label: "Triple" },
  { value: "quad", label: "Quad" },
  { value: "sharing", label: "Sharing" },
];

const PAY_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Card" },
];

const getStatusMeta = <T extends { value: string }>(list: T[], val: string) =>
  list.find((x) => x.value === val) || list[0];

// ── Mock Data ──
const DEFAULT_PACKAGES: HajjPackage[] = [
  {
    id: "hp1", name: "Hajj Economy 2026", type: "hajj", status: "active",
    duration: "40 Days", makkahNights: 15, madinahNights: 8,
    makkahHotel: "Al Shohada Hotel", madinahHotel: "Al Ansar Hotel",
    hotelClass: "3_star", flightInfo: "Biman BD — DAC→JED (Direct)",
    visaIncluded: true, transportIncluded: true, mealsIncluded: true, ziyaratIncluded: true,
    packagePrice: 550000, costPrice: 420000, profit: 130000,
    capacity: 50, enrolled: 3,
    departureDate: "2026-05-20", returnDate: "2026-06-28",
    highlights: "3-Star Hotels, Meals, Ziyarat, Transport, Visa",
    tenantId: "", createdAt: "2026-01-10",
  },
  {
    id: "hp2", name: "Hajj Premium 2026", type: "hajj", status: "active",
    duration: "35 Days", makkahNights: 12, madinahNights: 8,
    makkahHotel: "Hilton Suites Makkah", madinahHotel: "Oberoi Madinah",
    hotelClass: "5_star", flightInfo: "Saudi Airlines — DAC→JED (Business)",
    visaIncluded: true, transportIncluded: true, mealsIncluded: true, ziyaratIncluded: true,
    packagePrice: 850000, costPrice: 650000, profit: 200000,
    capacity: 30, enrolled: 0,
    departureDate: "2026-05-25", returnDate: "2026-06-28",
    highlights: "5-Star Hotels, Private Transport, VIP Ziyarat, Full Board",
    tenantId: "", createdAt: "2026-01-10",
  },
  {
    id: "hp3", name: "Umrah Ramadan 2026", type: "umrah", status: "upcoming",
    duration: "15 Days", makkahNights: 8, madinahNights: 5,
    makkahHotel: "Swissotel Makkah", madinahHotel: "Pullman Madinah",
    hotelClass: "4_star", flightInfo: "Biman BD — DAC→MED",
    visaIncluded: true, transportIncluded: true, mealsIncluded: false, ziyaratIncluded: true,
    packagePrice: 180000, costPrice: 135000, profit: 45000,
    capacity: 40, enrolled: 1,
    departureDate: "2026-03-01", returnDate: "2026-03-15",
    highlights: "4-Star Hotels, Ramadan Special, Ziyarat Included",
    tenantId: "", createdAt: "2026-02-01",
  },
];

const DEFAULT_GROUPS: HajjGroup[] = [
  { id: "g1", packageId: "hp1", name: "Batch-1 (May 2026)", leader: "Maulana Rafiq", leaderPhone: "01711-000111", departureDate: "2026-05-20", returnDate: "2026-06-28", tenantId: "", createdAt: "2026-01-15" },
  { id: "g2", packageId: "hp1", name: "Batch-2 (May 2026)", leader: "Hafez Karim", leaderPhone: "01811-000222", departureDate: "2026-05-22", returnDate: "2026-06-30", tenantId: "", createdAt: "2026-02-01" },
  { id: "g3", packageId: "hp3", name: "Umrah Ramadan Group-A", leader: "Imam Hasan", leaderPhone: "01911-000333", departureDate: "2026-03-01", returnDate: "2026-03-15", tenantId: "", createdAt: "2026-02-10" },
];

const DEFAULT_PILGRIMS: HajjPilgrim[] = [
  { id: "p1", packageId: "hp1", groupId: "g1", name: "Abdul Rahman", phone: "01712-111222", gender: "male", passportNumber: "A12345678", passportExpiry: "2030-06-15", nidNumber: "1990123456789", nationality: "Bangladeshi", mahramName: "Fatima Khatun", mahramRelation: "Wife", mahramPilgrimId: "p2", roomType: "double", roomNumber: "301", status: "confirmed", visaStatus: "approved", departureStatus: "not_departed", totalAmount: 550000, paidAmount: 400000, dueAmount: 150000, paymentStatus: "partial", emergencyContact: "Md. Rahim", emergencyPhone: "01712-999888", tenantId: "", createdAt: "2026-01-20" },
  { id: "p2", packageId: "hp1", groupId: "g1", name: "Fatima Khatun", phone: "01812-333444", gender: "female", passportNumber: "B98765432", passportExpiry: "2029-12-01", nidNumber: "1985567891234", nationality: "Bangladeshi", mahramName: "Abdul Rahman", mahramRelation: "Husband", mahramPilgrimId: "p1", roomType: "double", roomNumber: "301", status: "confirmed", visaStatus: "approved", departureStatus: "not_departed", totalAmount: 550000, paidAmount: 550000, dueAmount: 0, paymentStatus: "paid", emergencyContact: "Md. Rahim", emergencyPhone: "01812-777666", tenantId: "", createdAt: "2026-01-22" },
  { id: "p3", packageId: "hp1", groupId: "g2", name: "Kamal Uddin", phone: "01912-555666", gender: "male", passportNumber: "C11223344", passportExpiry: "2028-09-20", nidNumber: "1992345678901", nationality: "Bangladeshi", roomType: "triple", status: "documents_pending", visaStatus: "documents_collected", departureStatus: "not_departed", totalAmount: 550000, paidAmount: 100000, dueAmount: 450000, paymentStatus: "partial", emergencyContact: "Md. Salim", emergencyPhone: "01912-444333", tenantId: "", createdAt: "2026-02-05" },
  { id: "p4", packageId: "hp3", groupId: "g3", name: "Halima Begum", phone: "01612-777888", gender: "female", passportNumber: "D55667788", passportExpiry: "2031-03-10", nidNumber: "1988901234567", nationality: "Bangladeshi", mahramName: "Jahangir Alam (Non-pilgrim)", mahramRelation: "Brother", roomType: "sharing", status: "registered", visaStatus: "not_started", departureStatus: "not_departed", totalAmount: 180000, paidAmount: 0, dueAmount: 180000, paymentStatus: "unpaid", emergencyContact: "Jahangir Alam", emergencyPhone: "01612-222111", tenantId: "", createdAt: "2026-02-15" },
];

const DEFAULT_PAYMENTS: HajjPilgrimPayment[] = [
  { id: "pp1", pilgrimId: "p1", amount: 200000, method: "bank", reference: "TXN-001", date: "2026-01-20", installmentLabel: "1st Installment", note: "Registration payment", createdAt: "2026-01-20" },
  { id: "pp2", pilgrimId: "p1", amount: 200000, method: "bkash", reference: "BK-001", date: "2026-02-15", installmentLabel: "2nd Installment", note: "Second payment", createdAt: "2026-02-15" },
  { id: "pp3", pilgrimId: "p2", amount: 550000, method: "bank", reference: "TXN-002", date: "2026-01-22", installmentLabel: "Full Payment", note: "Full payment received", createdAt: "2026-01-22" },
  { id: "pp4", pilgrimId: "p3", amount: 100000, method: "cash", date: "2026-02-05", installmentLabel: "Booking Amount", note: "Booking deposit", createdAt: "2026-02-05" },
];

// ── Empty Forms ──
const emptyPkgForm = {
  name: "", type: "hajj" as HajjPackageType, status: "upcoming" as HajjPackageStatus,
  duration: "", makkahNights: 0, madinahNights: 0,
  makkahHotel: "", madinahHotel: "", hotelClass: "3_star" as string,
  flightInfo: "", visaIncluded: true, transportIncluded: true, mealsIncluded: true, ziyaratIncluded: true,
  packagePrice: 0, costPrice: 0,
  capacity: 0, departureDate: "", returnDate: "", highlights: "", notes: "",
};

const emptyGroupForm = {
  packageId: "", name: "", leader: "", leaderPhone: "",
  departureDate: "", returnDate: "", flightDetails: "", transportSchedule: "", notes: "",
};

const emptyPilgrimForm = {
  packageId: "", groupId: "", name: "", phone: "", email: "", dateOfBirth: "",
  gender: "male" as "male" | "female",
  passportNumber: "", passportExpiry: "", nidNumber: "", nationality: "Bangladeshi",
  mahramName: "", mahramRelation: "", mahramPilgrimId: "",
  roomType: "double" as HajjRoomType, roomNumber: "", roomPartners: "",
  status: "registered" as HajjPilgrimStatus, visaStatus: "not_started" as HajjVisaStatus,
  emergencyContact: "", emergencyPhone: "", medicalNotes: "", notes: "",
};

const emptyPayForm = {
  amount: 0, method: "cash" as string, reference: "",
  date: new Date().toISOString().split("T")[0], note: "", installmentLabel: "",
};

// ════════════════════════════════════════
const HajjUmrah = () => {
  const { toast } = useToast();

  // State
  const [packages, setPackages] = useState<HajjPackage[]>(DEFAULT_PACKAGES);
  const [groups, setGroups] = useState<HajjGroup[]>(DEFAULT_GROUPS);
  const [pilgrims, setPilgrims] = useState<HajjPilgrim[]>(DEFAULT_PILGRIMS);
  const [payments, setPayments] = useState<HajjPilgrimPayment[]>(DEFAULT_PAYMENTS);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [pkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [pilgrimDialogOpen, setPilgrimDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [pilgrimDetailOpen, setPilgrimDetailOpen] = useState(false);

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
  const [filterPkgId, setFilterPkgId] = useState("all");
  const [filterVisaStatus, setFilterVisaStatus] = useState("all");

  // Try fetch from API (fallback to mock data already set)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pkgs, grps, plgs] = await Promise.all([
          hajjApi.listPackages().catch(() => null),
          hajjApi.listGroups().catch(() => null),
          hajjApi.listPilgrims().catch(() => null),
        ]);
        if (pkgs) setPackages(pkgs);
        if (grps) setGroups(grps);
        if (plgs) setPilgrims(plgs);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // ── Summary ──
  const summary = useMemo(() => {
    const totalPilgrims = pilgrims.length;
    const totalRevenue = pilgrims.reduce((s, p) => s + p.totalAmount, 0);
    const totalCollected = pilgrims.reduce((s, p) => s + p.paidAmount, 0);
    const totalDue = pilgrims.reduce((s, p) => s + p.dueAmount, 0);
    const totalCost = packages.reduce((s, pk) => {
      const count = pilgrims.filter((p) => p.packageId === pk.id).length;
      return s + (pk.costPrice * count);
    }, 0);
    const grossProfit = totalRevenue - totalCost;
    const visaPending = pilgrims.filter((p) => p.visaStatus !== "approved").length;
    const docsPending = pilgrims.filter((p) => p.status === "documents_pending").length;
    return { totalPilgrims, totalRevenue, totalCollected, totalDue, grossProfit, totalCost, visaPending, docsPending };
  }, [pilgrims, packages]);

  // ── Package Profitability ──
  const pkgProfitability = useMemo(() => {
    return packages.map((pk) => {
      const enrolled = pilgrims.filter((p) => p.packageId === pk.id).length;
      const revenue = enrolled * pk.packagePrice;
      const cost = enrolled * pk.costPrice;
      return { ...pk, enrolled, revenue, cost, profit: revenue - cost };
    });
  }, [packages, pilgrims]);

  // ── Handlers ──
  const handlePkgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profit = pkgForm.packagePrice - pkgForm.costPrice;
    if (editingPkgId) {
      try {
        const updated = await hajjApi.updatePackage(editingPkgId, { ...pkgForm, profit } as any).catch(() => null);
        setPackages((prev) => prev.map((p) => p.id === editingPkgId ? { ...p, ...pkgForm, profit, hotelClass: pkgForm.hotelClass as HajjPackage["hotelClass"] } : p));
        toast({ title: "Package updated" });
      } catch {}
    } else {
      try {
        const created = await hajjApi.createPackage({ ...pkgForm, profit } as any).catch(() => null);
        const newPkg = created || { ...pkgForm, profit, id: crypto.randomUUID(), enrolled: 0, tenantId: "", createdAt: new Date().toISOString().split("T")[0], hotelClass: pkgForm.hotelClass as HajjPackage["hotelClass"] } as HajjPackage;
        setPackages((prev) => [...prev, newPkg]);
        toast({ title: "Package created" });
      } catch {}
    }
    setPkgForm(emptyPkgForm);
    setEditingPkgId(null);
    setPkgDialogOpen(false);
  };

  const editPkg = (pkg: HajjPackage) => {
    setPkgForm({
      name: pkg.name, type: pkg.type, status: pkg.status,
      duration: pkg.duration, makkahNights: pkg.makkahNights, madinahNights: pkg.madinahNights,
      makkahHotel: pkg.makkahHotel || "", madinahHotel: pkg.madinahHotel || "",
      hotelClass: pkg.hotelClass, flightInfo: pkg.flightInfo || "",
      visaIncluded: pkg.visaIncluded, transportIncluded: pkg.transportIncluded,
      mealsIncluded: pkg.mealsIncluded, ziyaratIncluded: pkg.ziyaratIncluded,
      packagePrice: pkg.packagePrice, costPrice: pkg.costPrice,
      capacity: pkg.capacity, departureDate: pkg.departureDate || "", returnDate: pkg.returnDate || "",
      highlights: pkg.highlights || "", notes: pkg.notes || "",
    });
    setEditingPkgId(pkg.id);
    setPkgDialogOpen(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroupId) {
      await hajjApi.updateGroup(editingGroupId, groupForm as any).catch(() => null);
      setGroups((prev) => prev.map((g) => g.id === editingGroupId ? { ...g, ...groupForm } : g));
      toast({ title: "Group updated" });
    } else {
      const created = await hajjApi.createGroup(groupForm as any).catch(() => null);
      const newGroup: HajjGroup = created || { ...groupForm, id: crypto.randomUUID(), tenantId: "", createdAt: new Date().toISOString().split("T")[0] } as HajjGroup;
      setGroups((prev) => [...prev, newGroup]);
      toast({ title: "Group created" });
    }
    setGroupForm(emptyGroupForm);
    setEditingGroupId(null);
    setGroupDialogOpen(false);
  };

  const handlePilgrimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = packages.find((p) => p.id === pilgrimForm.packageId);
    const totalAmount = pkg?.packagePrice || 0;
    const pilgrimData = {
      ...pilgrimForm, totalAmount, paidAmount: 0, dueAmount: totalAmount,
      paymentStatus: "unpaid" as const, departureStatus: "not_departed" as const,
    };
    const created = await hajjApi.createPilgrim(pilgrimData as any).catch(() => null);
    const newPilgrim: HajjPilgrim = created || { ...pilgrimData, id: crypto.randomUUID(), tenantId: "", createdAt: new Date().toISOString().split("T")[0] } as HajjPilgrim;
    setPilgrims((prev) => [...prev, newPilgrim]);
    toast({ title: "Pilgrim added", description: pilgrimForm.name });
    setPilgrimForm(emptyPilgrimForm);
    setPilgrimDialogOpen(false);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPilgrimId) return;
    const pilgrim = pilgrims.find((p) => p.id === selectedPilgrimId);
    if (!pilgrim) return;
    const payAmount = Math.min(payForm.amount, pilgrim.dueAmount);
    if (payAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    const payData = { ...payForm, amount: payAmount, pilgrimId: selectedPilgrimId };
    const created = await hajjApi.addPilgrimPayment(selectedPilgrimId, payData as any).catch(() => null);
    const newPay: HajjPilgrimPayment = created || { ...payData, id: crypto.randomUUID(), createdAt: new Date().toISOString().split("T")[0] } as HajjPilgrimPayment;
    setPayments((prev) => [...prev, newPay]);
    const newPaid = pilgrim.paidAmount + payAmount;
    const newDue = pilgrim.totalAmount - newPaid;
    setPilgrims((prev) => prev.map((p) => p.id === selectedPilgrimId ? {
      ...p, paidAmount: newPaid, dueAmount: Math.max(0, newDue),
      paymentStatus: newDue <= 0 ? "paid" : "partial",
    } : p));
    toast({ title: "Payment recorded", description: `৳${payAmount.toLocaleString()} — ${pilgrim.name}` });
    setPayForm(emptyPayForm);
    setPayDialogOpen(false);
  };

  // ── Helpers ──
  const getPkgName = (id: string) => packages.find((p) => p.id === id)?.name || "—";
  const getGroupName = (id: string) => groups.find((g) => g.id === id)?.name || "—";
  const getPilgrimCountForGroup = (groupId: string) => pilgrims.filter((p) => p.groupId === groupId).length;

  const filteredPilgrims = useMemo(() => {
    return pilgrims.filter((p) => {
      const matchSearch = !searchPilgrim ||
        p.name.toLowerCase().includes(searchPilgrim.toLowerCase()) ||
        p.phone.includes(searchPilgrim) ||
        p.passportNumber.toLowerCase().includes(searchPilgrim.toLowerCase());
      const matchPkg = filterPkgId === "all" || p.packageId === filterPkgId;
      const matchVisa = filterVisaStatus === "all" || p.visaStatus === filterVisaStatus;
      return matchSearch && matchPkg && matchVisa;
    });
  }, [pilgrims, searchPilgrim, filterPkgId, filterVisaStatus]);

  const selectedPilgrim = pilgrims.find((p) => p.id === selectedPilgrimId);
  const selectedPilgrimPayments = useMemo(() =>
    payments.filter((p) => p.pilgrimId === selectedPilgrimId), [payments, selectedPilgrimId]);

  const groupsForPilgrimForm = useMemo(() =>
    pilgrimForm.packageId ? groups.filter((g) => g.packageId === pilgrimForm.packageId) : [],
    [groups, pilgrimForm.packageId]);

  // ── Export ──
  const handleExport = () => {
    const headers = ["Name", "Phone", "Passport", "Package", "Group", "Visa", "Status", "Total", "Paid", "Due"];
    const rows = filteredPilgrims.map((p) => [
      p.name, p.phone, p.passportNumber, getPkgName(p.packageId), getGroupName(p.groupId),
      p.visaStatus, p.status, p.totalAmount.toString(), p.paidAmount.toString(), p.dueAmount.toString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "hajj-umrah-pilgrims.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "Exported pilgrim list" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Moon className="h-8 w-8" /> Hajj & Umrah Management
            </h1>
            <p className="text-muted-foreground">Packages, pilgrims, visa tracking, room allocation, and payment collection</p>
          </div>
          <div className="flex gap-2">
            <PermissionGate module="hajj_umrah" action="export">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1 h-4 w-4" /> Export
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Pilgrims</div>
              <p className="text-2xl font-bold">{summary.totalPilgrims}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Revenue</div>
              <p className="text-2xl font-bold">৳{summary.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Collected</div>
              <p className="text-2xl font-bold text-green-600">৳{summary.totalCollected.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Outstanding</div>
              <p className="text-2xl font-bold text-destructive">৳{summary.totalDue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Gross Profit</div>
              <p className={`text-2xl font-bold ${summary.grossProfit >= 0 ? "text-green-600" : "text-destructive"}`}>৳{summary.grossProfit.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Packages</div>
              <p className="text-2xl font-bold">{packages.length}</p>
            </CardContent>
          </Card>
          <Card className={summary.visaPending > 0 ? "border-orange-300 dark:border-orange-600" : ""}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Visa Pending</div>
              <p className="text-2xl font-bold">{summary.visaPending}</p>
            </CardContent>
          </Card>
          <Card className={summary.docsPending > 0 ? "border-yellow-300 dark:border-yellow-600" : ""}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Docs Pending</div>
              <p className="text-2xl font-bold">{summary.docsPending}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="packages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="groups">Groups / Batches</TabsTrigger>
            <TabsTrigger value="pilgrims">Pilgrim List</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
          </TabsList>

          {/* ═══ PACKAGES TAB ═══ */}
          <TabsContent value="packages" className="space-y-4">
            <div className="flex justify-end">
              <PermissionGate module="hajj_umrah" action="create">
                <Button onClick={() => { setPkgForm(emptyPkgForm); setEditingPkgId(null); setPkgDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> New Package
                </Button>
              </PermissionGate>
            </div>
            {packages.length === 0 ? (
              <EmptyState icon={Moon} title="No packages yet" description="Create your first Hajj or Umrah package to start enrolling pilgrims." actionLabel="New Package" onAction={() => setPkgDialogOpen(true)} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => {
                  const statusMeta = getStatusMeta(PKG_STATUS_META, pkg.status);
                  const enrolled = pilgrims.filter((p) => p.packageId === pkg.id).length;
                  return (
                    <Card key={pkg.id} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
                          <Badge variant="outline" className="capitalize">{pkg.type}</Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.duration} • {pkg.makkahNights}N Makkah + {pkg.madinahNights}N Madinah</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Hotel className="h-3 w-3" /> {pkg.hotelClass.replace("_", "-")} — {pkg.makkahHotel || "TBA"} / {pkg.madinahHotel || "TBA"}</div>
                          <div className="flex items-center gap-1"><Plane className="h-3 w-3" /> {pkg.flightInfo || "TBA"}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {pkg.visaIncluded && <Badge variant="secondary" className="text-[10px]">Visa</Badge>}
                            {pkg.transportIncluded && <Badge variant="secondary" className="text-[10px]">Transport</Badge>}
                            {pkg.mealsIncluded && <Badge variant="secondary" className="text-[10px]">Meals</Badge>}
                            {pkg.ziyaratIncluded && <Badge variant="secondary" className="text-[10px]">Ziyarat</Badge>}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-primary">৳{pkg.packagePrice.toLocaleString()}</span>
                            <p className="text-xs text-muted-foreground">{enrolled}/{pkg.capacity} enrolled • Profit/pilgrim: ৳{(pkg.packagePrice - pkg.costPrice).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-1">
                            <PermissionGate module="hajj_umrah" action="edit">
                              <Button variant="ghost" size="icon" onClick={() => editPkg(pkg)}><Pencil className="h-4 w-4" /></Button>
                            </PermissionGate>
                            <PermissionGate module="hajj_umrah" action="delete">
                              <Button variant="ghost" size="icon" onClick={() => { setPackages((p) => p.filter((x) => x.id !== pkg.id)); toast({ title: "Package deleted" }); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ═══ GROUPS TAB ═══ */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex justify-end">
              <PermissionGate module="hajj_umrah" action="create">
                <Button onClick={() => { setGroupForm(emptyGroupForm); setEditingGroupId(null); setGroupDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> New Group
                </Button>
              </PermissionGate>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group / Batch</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead className="text-center">Pilgrims</TableHead>
                      <TableHead>Flight</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No groups created yet.</TableCell></TableRow>
                    ) : groups.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell><Badge variant="secondary">{getPkgName(g.packageId)}</Badge></TableCell>
                        <TableCell>
                          <div><p className="text-sm">{g.leader}</p><p className="text-xs text-muted-foreground">{g.leaderPhone}</p></div>
                        </TableCell>
                        <TableCell className="text-sm">{g.departureDate}</TableCell>
                        <TableCell className="text-sm">{g.returnDate}</TableCell>
                        <TableCell className="text-center font-semibold">{getPilgrimCountForGroup(g.id)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{g.flightDetails || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <PermissionGate module="hajj_umrah" action="edit">
                              <Button variant="ghost" size="icon" onClick={() => {
                                setGroupForm({ packageId: g.packageId, name: g.name, leader: g.leader, leaderPhone: g.leaderPhone || "", departureDate: g.departureDate, returnDate: g.returnDate, flightDetails: g.flightDetails || "", transportSchedule: g.transportSchedule || "", notes: g.notes || "" });
                                setEditingGroupId(g.id);
                                setGroupDialogOpen(true);
                              }}><Pencil className="h-4 w-4" /></Button>
                            </PermissionGate>
                            <PermissionGate module="hajj_umrah" action="delete">
                              <Button variant="ghost" size="icon" onClick={() => { setGroups((prev) => prev.filter((x) => x.id !== g.id)); toast({ title: "Group deleted" }); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </PermissionGate>
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
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name, phone, passport..." value={searchPilgrim} onChange={(e) => setSearchPilgrim(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Select value={filterPkgId} onValueChange={setFilterPkgId}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All packages" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterVisaStatus} onValueChange={setFilterVisaStatus}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All visa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visa Status</SelectItem>
                    {VISA_STATUS_META.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <PermissionGate module="hajj_umrah" action="create">
                  <Button onClick={() => { setPilgrimForm(emptyPilgrimForm); setPilgrimDialogOpen(true); }}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Pilgrim
                  </Button>
                </PermissionGate>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Passport</TableHead>
                      <TableHead>Visa</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Mahram</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPilgrims.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No pilgrims match your filters.</TableCell></TableRow>
                    ) : filteredPilgrims.map((p) => {
                      const statusMeta = getStatusMeta(PILGRIM_STATUS_META, p.status);
                      const visaMeta = getStatusMeta(VISA_STATUS_META, p.visaStatus);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{getPkgName(p.packageId)}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{getGroupName(p.groupId)}</TableCell>
                          <TableCell className="font-mono text-xs">{p.passportNumber}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${visaMeta.color}`}>{visaMeta.label}</span>
                          </TableCell>
                          <TableCell className="text-xs">{p.roomType ? `${p.roomType}${p.roomNumber ? ` #${p.roomNumber}` : ""}` : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">{p.mahramName || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusMeta.color}`}>{statusMeta.label}</span>
                          </TableCell>
                          <TableCell className="text-right text-destructive font-semibold text-sm">৳{p.dueAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="min-w-[60px]">
                              <Progress value={p.totalAmount > 0 ? (p.paidAmount / p.totalAmount) * 100 : 0} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" title="View Details" onClick={() => { setSelectedPilgrimId(p.id); setPilgrimDetailOpen(true); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <PermissionGate module="hajj_umrah" action="edit">
                                <Button variant="ghost" size="icon" title="Record Payment" onClick={() => { setSelectedPilgrimId(p.id); setPayForm(emptyPayForm); setPayDialogOpen(true); }}>
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PAYMENTS TAB ═══ */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>All Pilgrim Payments ({payments.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pilgrim</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded yet.</TableCell></TableRow>
                    ) : [...payments].reverse().map((pay) => {
                      const pilgrim = pilgrims.find((p) => p.id === pay.pilgrimId);
                      return (
                        <TableRow key={pay.id}>
                          <TableCell className="text-sm">{pay.date}</TableCell>
                          <TableCell className="font-medium">{pilgrim?.name || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{pay.installmentLabel || "Payment"}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize text-xs">{pay.method}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{pay.reference || "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">৳{pay.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{pay.note || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PROFITABILITY TAB ═══ */}
          <TabsContent value="profitability" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Package-Wise Profitability</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Enrolled</TableHead>
                      <TableHead className="text-right">Price/Pilgrim</TableHead>
                      <TableHead className="text-right">Cost/Pilgrim</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead>Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pkgProfitability.map((pkg) => {
                      const margin = pkg.revenue > 0 ? ((pkg.profit / pkg.revenue) * 100).toFixed(1) : "0";
                      return (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{pkg.type}</Badge></TableCell>
                          <TableCell className="text-center">{pkg.enrolled}/{pkg.capacity}</TableCell>
                          <TableCell className="text-right">৳{pkg.packagePrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-muted-foreground">৳{pkg.costPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">৳{pkg.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-muted-foreground">৳{pkg.cost.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-semibold ${pkg.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                            ৳{pkg.profit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={Number(margin) >= 20 ? "default" : "secondary"}>{margin}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-center">{pkgProfitability.reduce((s, p) => s + p.enrolled, 0)}</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-right">৳{pkgProfitability.reduce((s, p) => s + p.revenue, 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">৳{pkgProfitability.reduce((s, p) => s + p.cost, 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">৳{pkgProfitability.reduce((s, p) => s + p.profit, 0).toLocaleString()}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══ PACKAGE DIALOG ═══ */}
        <Dialog open={pkgDialogOpen} onOpenChange={(v) => { setPkgDialogOpen(v); if (!v) { setPkgForm(emptyPkgForm); setEditingPkgId(null); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingPkgId ? "Edit" : "Create"} Package</DialogTitle></DialogHeader>
            <form onSubmit={handlePkgSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Package Name *</Label>
                  <Input value={pkgForm.name} onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Hajj Premium 2026" required />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={pkgForm.type} onValueChange={(v) => setPkgForm((f) => ({ ...f, type: v as HajjPackageType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hajj">Hajj</SelectItem>
                      <SelectItem value="umrah">Umrah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={pkgForm.status} onValueChange={(v) => setPkgForm((f) => ({ ...f, status: v as HajjPackageStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PKG_STATUS_META.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input value={pkgForm.duration} onChange={(e) => setPkgForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 40 Days" required />
                </div>
                <div className="space-y-2">
                  <Label>Makkah Nights</Label>
                  <Input type="number" min={0} value={pkgForm.makkahNights || ""} onChange={(e) => setPkgForm((f) => ({ ...f, makkahNights: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Madinah Nights</Label>
                  <Input type="number" min={0} value={pkgForm.madinahNights || ""} onChange={(e) => setPkgForm((f) => ({ ...f, madinahNights: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input type="number" min={1} value={pkgForm.capacity || ""} onChange={(e) => setPkgForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Hotel Class</Label>
                  <Select value={pkgForm.hotelClass} onValueChange={(v) => setPkgForm((f) => ({ ...f, hotelClass: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HOTEL_CLASSES.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Makkah Hotel</Label>
                  <Input value={pkgForm.makkahHotel} onChange={(e) => setPkgForm((f) => ({ ...f, makkahHotel: e.target.value }))} placeholder="e.g. Hilton Suites" />
                </div>
                <div className="space-y-2">
                  <Label>Madinah Hotel</Label>
                  <Input value={pkgForm.madinahHotel} onChange={(e) => setPkgForm((f) => ({ ...f, madinahHotel: e.target.value }))} placeholder="e.g. Oberoi Madinah" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Flight Info</Label>
                <Input value={pkgForm.flightInfo} onChange={(e) => setPkgForm((f) => ({ ...f, flightInfo: e.target.value }))} placeholder="e.g. Biman BD — DAC→JED (Direct)" />
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2"><Switch checked={pkgForm.visaIncluded} onCheckedChange={(v) => setPkgForm((f) => ({ ...f, visaIncluded: v }))} /><Label>Visa Included</Label></div>
                <div className="flex items-center gap-2"><Switch checked={pkgForm.transportIncluded} onCheckedChange={(v) => setPkgForm((f) => ({ ...f, transportIncluded: v }))} /><Label>Transport</Label></div>
                <div className="flex items-center gap-2"><Switch checked={pkgForm.mealsIncluded} onCheckedChange={(v) => setPkgForm((f) => ({ ...f, mealsIncluded: v }))} /><Label>Meals</Label></div>
                <div className="flex items-center gap-2"><Switch checked={pkgForm.ziyaratIncluded} onCheckedChange={(v) => setPkgForm((f) => ({ ...f, ziyaratIncluded: v }))} /><Label>Ziyarat</Label></div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Package Price (৳)</Label>
                  <Input type="number" min={0} value={pkgForm.packagePrice || ""} onChange={(e) => setPkgForm((f) => ({ ...f, packagePrice: parseFloat(e.target.value) || 0 }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Cost Price (৳)</Label>
                  <Input type="number" min={0} value={pkgForm.costPrice || ""} onChange={(e) => setPkgForm((f) => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Profit / Pilgrim</Label>
                  <div className={`rounded-md border px-3 py-2 text-sm font-semibold ${(pkgForm.packagePrice - pkgForm.costPrice) >= 0 ? "text-green-600" : "text-destructive"}`}>
                    ৳{(pkgForm.packagePrice - pkgForm.costPrice).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure Date</Label>
                  <Input type="date" value={pkgForm.departureDate} onChange={(e) => setPkgForm((f) => ({ ...f, departureDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Input type="date" value={pkgForm.returnDate} onChange={(e) => setPkgForm((f) => ({ ...f, returnDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Highlights</Label>
                <Input value={pkgForm.highlights} onChange={(e) => setPkgForm((f) => ({ ...f, highlights: e.target.value }))} placeholder="5-Star Hotels, VIP Transport, Full Board..." />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingPkgId ? "Update Package" : "Create Package"}</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ GROUP DIALOG ═══ */}
        <Dialog open={groupDialogOpen} onOpenChange={(v) => { setGroupDialogOpen(v); if (!v) { setGroupForm(emptyGroupForm); setEditingGroupId(null); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingGroupId ? "Edit" : "Create"} Group / Batch</DialogTitle></DialogHeader>
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Package *</Label>
                <Select value={groupForm.packageId} onValueChange={(v) => setGroupForm((f) => ({ ...f, packageId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Group Name *</Label>
                <Input value={groupForm.name} onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Batch-1 (May 2026)" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Group Leader</Label><Input value={groupForm.leader} onChange={(e) => setGroupForm((f) => ({ ...f, leader: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Leader Phone</Label><Input value={groupForm.leaderPhone} onChange={(e) => setGroupForm((f) => ({ ...f, leaderPhone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Departure</Label><Input type="date" value={groupForm.departureDate} onChange={(e) => setGroupForm((f) => ({ ...f, departureDate: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Return</Label><Input type="date" value={groupForm.returnDate} onChange={(e) => setGroupForm((f) => ({ ...f, returnDate: e.target.value }))} required /></div>
              </div>
              <div className="space-y-2">
                <Label>Flight Details</Label>
                <Input value={groupForm.flightDetails} onChange={(e) => setGroupForm((f) => ({ ...f, flightDetails: e.target.value }))} placeholder="e.g. BG-301 DAC→JED 20 May 10:30 AM" />
              </div>
              <div className="space-y-2">
                <Label>Transport Schedule</Label>
                <Input value={groupForm.transportSchedule} onChange={(e) => setGroupForm((f) => ({ ...f, transportSchedule: e.target.value }))} placeholder="e.g. Bus pickup from hotel at 8 AM" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingGroupId ? "Update" : "Create"}</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ PILGRIM DIALOG ═══ */}
        <Dialog open={pilgrimDialogOpen} onOpenChange={(v) => { setPilgrimDialogOpen(v); if (!v) setPilgrimForm(emptyPilgrimForm); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Pilgrim</DialogTitle></DialogHeader>
            <form onSubmit={handlePilgrimSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Package *</Label>
                  <Select value={pilgrimForm.packageId} onValueChange={(v) => setPilgrimForm((f) => ({ ...f, packageId: v, groupId: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Group *</Label>
                  <Select value={pilgrimForm.groupId} onValueChange={(v) => setPilgrimForm((f) => ({ ...f, groupId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{groupsForPilgrimForm.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={pilgrimForm.gender} onValueChange={(v) => setPilgrimForm((f) => ({ ...f, gender: v as "male" | "female" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name *</Label><Input value={pilgrimForm.name} onChange={(e) => setPilgrimForm((f) => ({ ...f, name: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input value={pilgrimForm.phone} onChange={(e) => setPilgrimForm((f) => ({ ...f, phone: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Passport No *</Label><Input value={pilgrimForm.passportNumber} onChange={(e) => setPilgrimForm((f) => ({ ...f, passportNumber: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Passport Expiry</Label><Input type="date" value={pilgrimForm.passportExpiry} onChange={(e) => setPilgrimForm((f) => ({ ...f, passportExpiry: e.target.value }))} /></div>
                <div className="space-y-2"><Label>NID No</Label><Input value={pilgrimForm.nidNumber} onChange={(e) => setPilgrimForm((f) => ({ ...f, nidNumber: e.target.value }))} /></div>
              </div>
              <Separator />
              <p className="text-sm font-medium">Mahram Details (for female pilgrims)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Mahram Name</Label><Input value={pilgrimForm.mahramName} onChange={(e) => setPilgrimForm((f) => ({ ...f, mahramName: e.target.value }))} placeholder="e.g. Abdul Rahman" /></div>
                <div className="space-y-2"><Label>Relation</Label><Input value={pilgrimForm.mahramRelation} onChange={(e) => setPilgrimForm((f) => ({ ...f, mahramRelation: e.target.value }))} placeholder="Husband / Father / Brother" /></div>
                <div className="space-y-2">
                  <Label>Mahram (if pilgrim)</Label>
                  <Select value={pilgrimForm.mahramPilgrimId || "none"} onValueChange={(v) => setPilgrimForm((f) => ({ ...f, mahramPilgrimId: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Link to pilgrim" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not a pilgrim</SelectItem>
                      {pilgrims.filter((p) => p.gender === "male").map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <p className="text-sm font-medium">Room Allocation</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={pilgrimForm.roomType} onValueChange={(v) => setPilgrimForm((f) => ({ ...f, roomType: v as HajjRoomType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROOM_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Room Number</Label><Input value={pilgrimForm.roomNumber} onChange={(e) => setPilgrimForm((f) => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 301" /></div>
                <div className="space-y-2"><Label>Room Partners</Label><Input value={pilgrimForm.roomPartners} onChange={(e) => setPilgrimForm((f) => ({ ...f, roomPartners: e.target.value }))} placeholder="e.g. Fatima, Halima" /></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Emergency Contact</Label><Input value={pilgrimForm.emergencyContact} onChange={(e) => setPilgrimForm((f) => ({ ...f, emergencyContact: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Emergency Phone</Label><Input value={pilgrimForm.emergencyPhone} onChange={(e) => setPilgrimForm((f) => ({ ...f, emergencyPhone: e.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Medical Notes</Label>
                <Textarea value={pilgrimForm.medicalNotes} onChange={(e) => setPilgrimForm((f) => ({ ...f, medicalNotes: e.target.value }))} placeholder="Allergies, medications, mobility needs..." rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1"><UserPlus className="mr-2 h-4 w-4" /> Add Pilgrim</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══ PILGRIM DETAIL DIALOG ═══ */}
        <Dialog open={pilgrimDetailOpen} onOpenChange={(v) => { setPilgrimDetailOpen(v); if (!v) setSelectedPilgrimId(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Pilgrim Details</DialogTitle></DialogHeader>
            {selectedPilgrim && (
              <div className="space-y-4">
                {/* Profile */}
                <div className="rounded-md border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{selectedPilgrim.name}</h3>
                    <div className="flex gap-1">
                      <Badge className={getStatusMeta(PILGRIM_STATUS_META, selectedPilgrim.status).color}>{getStatusMeta(PILGRIM_STATUS_META, selectedPilgrim.status).label}</Badge>
                      <Badge className={getStatusMeta(VISA_STATUS_META, selectedPilgrim.visaStatus).color}>{getStatusMeta(VISA_STATUS_META, selectedPilgrim.visaStatus).label}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Phone:</span> {selectedPilgrim.phone}</div>
                    <div><span className="text-muted-foreground">Gender:</span> {selectedPilgrim.gender || "—"}</div>
                    <div><span className="text-muted-foreground">Passport:</span> {selectedPilgrim.passportNumber} {selectedPilgrim.passportExpiry && `(Exp: ${selectedPilgrim.passportExpiry})`}</div>
                    <div><span className="text-muted-foreground">NID:</span> {selectedPilgrim.nidNumber || "—"}</div>
                    <div><span className="text-muted-foreground">Package:</span> {getPkgName(selectedPilgrim.packageId)}</div>
                    <div><span className="text-muted-foreground">Group:</span> {getGroupName(selectedPilgrim.groupId)}</div>
                  </div>
                </div>

                {/* Mahram & Room */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Mahram</p>
                    {selectedPilgrim.mahramName ? (
                      <div className="text-sm">
                        <p>{selectedPilgrim.mahramName} ({selectedPilgrim.mahramRelation})</p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Not specified</p>}
                  </div>
                  <div className="rounded-md border p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Room</p>
                    <p className="text-sm capitalize">{selectedPilgrim.roomType || "Not assigned"}{selectedPilgrim.roomNumber && ` — #${selectedPilgrim.roomNumber}`}</p>
                    {selectedPilgrim.roomPartners && <p className="text-xs text-muted-foreground">Partners: {selectedPilgrim.roomPartners}</p>}
                  </div>
                </div>

                {/* Financial */}
                <div className="rounded-md border p-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm text-center">
                    <div><p className="text-muted-foreground text-xs">Total</p><p className="font-bold">৳{selectedPilgrim.totalAmount.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground text-xs">Paid</p><p className="font-bold text-green-600">৳{selectedPilgrim.paidAmount.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground text-xs">Due</p><p className="font-bold text-destructive">৳{selectedPilgrim.dueAmount.toLocaleString()}</p></div>
                  </div>
                  <Progress value={selectedPilgrim.totalAmount > 0 ? (selectedPilgrim.paidAmount / selectedPilgrim.totalAmount) * 100 : 0} className="h-2" />
                </div>

                {/* Payment History */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Payment History</h4>
                    {selectedPilgrim.dueAmount > 0 && (
                      <Button size="sm" onClick={() => { setPayForm(emptyPayForm); setPayDialogOpen(true); }}>
                        <CreditCard className="mr-1 h-3.5 w-3.5" /> Add Payment
                      </Button>
                    )}
                  </div>
                  {selectedPilgrimPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Installment</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPilgrimPayments.map((pay) => (
                          <TableRow key={pay.id}>
                            <TableCell className="text-sm">{pay.date}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{pay.installmentLabel || "Payment"}</Badge></TableCell>
                            <TableCell className="capitalize text-sm">{pay.method}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">৳{pay.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{pay.note || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Emergency & Medical */}
                {(selectedPilgrim.emergencyContact || selectedPilgrim.medicalNotes) && (
                  <div className="rounded-md border p-3 space-y-1 text-sm">
                    {selectedPilgrim.emergencyContact && <p><span className="text-muted-foreground">Emergency:</span> {selectedPilgrim.emergencyContact} {selectedPilgrim.emergencyPhone && `(${selectedPilgrim.emergencyPhone})`}</p>}
                    {selectedPilgrim.medicalNotes && <p><span className="text-muted-foreground">Medical:</span> {selectedPilgrim.medicalNotes}</p>}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ═══ PAYMENT DIALOG ═══ */}
        <Dialog open={payDialogOpen} onOpenChange={(v) => { setPayDialogOpen(v); if (!v) setPayForm(emptyPayForm); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Pilgrim Payment</DialogTitle></DialogHeader>
            {selectedPilgrim && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 mb-2">
                <p className="font-medium">{selectedPilgrim.name}</p>
                <p>Total: ৳{selectedPilgrim.totalAmount.toLocaleString()} • Paid: ৳{selectedPilgrim.paidAmount.toLocaleString()} • <span className="text-destructive font-semibold">Due: ৳{selectedPilgrim.dueAmount.toLocaleString()}</span></p>
              </div>
            )}
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (৳) *</Label>
                  <Input type="number" min={1} max={selectedPilgrim?.dueAmount} value={payForm.amount || ""} onChange={(e) => setPayForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAY_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={payForm.date} onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Reference</Label><Input value={payForm.reference} onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} placeholder="TXN / Receipt no." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Installment Label</Label><Input value={payForm.installmentLabel} onChange={(e) => setPayForm((f) => ({ ...f, installmentLabel: e.target.value }))} placeholder="e.g. 1st Installment" /></div>
                <div className="space-y-2"><Label>Note</Label><Input value={payForm.note} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional note" /></div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1"><CreditCard className="mr-2 h-4 w-4" /> Record Payment</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default HajjUmrah;
