import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import PermissionGate from "@/components/PermissionGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { quotationApi, type Quotation, type QuotationStatus } from "@/lib/api";
import {
  FileText, Plus, Search, Eye, Pencil, Trash2, Copy, ArrowRight,
  DollarSign, Users, MapPin, CalendarIcon,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_META: { value: QuotationStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "expired", label: "Expired", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
];

const getStatusMeta = (s: QuotationStatus) => STATUS_META.find((x) => x.value === s) || STATUS_META[0];

const Quotations = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await quotationApi.list();
      setQuotations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      const matchSearch = !search ||
        q.title?.toLowerCase().includes(search.toLowerCase()) ||
        q.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        q.destination?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: quotations.length };
    STATUS_META.forEach((s) => { counts[s.value] = quotations.filter((q) => q.status === s.value).length; });
    return counts;
  }, [quotations]);

  const handleDelete = async (id: string) => {
    try {
      await quotationApi.delete(id);
      setQuotations((p) => p.filter((q) => q.id !== id));
      toast({ title: "Quotation deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await quotationApi.duplicate(id);
      setQuotations((p) => [dup, ...p]);
      toast({ title: "Quotation duplicated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleConvert = async (q: Quotation) => {
    try {
      await quotationApi.convertToBooking(q.id);
      toast({ title: "Booking created from quotation!" });
      navigate("/bookings");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  // Summary cards
  const totalValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const totalProfit = quotations.reduce((sum, q) => sum + (q.totalProfit || 0), 0);
  const approvedCount = quotations.filter((q) => q.status === "approved").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8" /> Quotations
            </h1>
            <p className="text-muted-foreground">Create and manage travel quotations</p>
          </div>
          <PermissionGate module="quotations" action="create">
            <Button onClick={() => navigate("/quotations/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Quotation
            </Button>
          </PermissionGate>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total Quotes</div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{quotations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Approved</div>
                <Badge variant="secondary">{approvedCount}</Badge>
              </div>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total Value</div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">৳{totalValue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Est. Profit</div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">৳{totalProfit.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
            All ({statusCounts.all})
          </Button>
          {STATUS_META.map((s) => (
            <Button key={s.value} variant={statusFilter === s.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s.value)}>
              {s.label} ({statusCounts[s.value] || 0})
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, client, destination..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : quotations.length === 0 ? (
          <EmptyState icon={FileText} title="No quotations yet" description="Create your first travel quotation" actionLabel="New Quotation" onAction={() => navigate("/quotations/new")} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Travelers</TableHead>
                    <TableHead>Grand Total</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No quotations found.</TableCell></TableRow>
                  ) : (
                    filtered.map((q) => {
                      const meta = getStatusMeta(q.status);
                      return (
                        <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate(`/quotations/${q.id}`)}>
                          <TableCell className="font-medium max-w-[200px] truncate">{q.title || "Untitled"}</TableCell>
                          <TableCell className="text-sm">{q.clientName || q.leadName || "—"}</TableCell>
                          <TableCell>
                            {q.destination ? (
                              <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3 text-muted-foreground" />{q.destination}</div>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm"><Users className="h-3 w-3 text-muted-foreground" />{q.travelerCount || 1}</div>
                          </TableCell>
                          <TableCell className="font-medium">৳{(q.grandTotal || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-green-600">৳{(q.totalProfit || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">v{q.version || 1}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{q.validUntil || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`/quotations/${q.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <PermissionGate module="quotations" action="edit">
                                <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/quotations/${q.id}/edit`)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate module="quotations" action="create">
                                <Button variant="ghost" size="icon" title="Duplicate" onClick={() => handleDuplicate(q.id)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              {q.status === "approved" && (
                                <PermissionGate module="quotations" action="approve">
                                  <Button variant="ghost" size="icon" title="Convert to Booking" onClick={() => handleConvert(q)}>
                                    <ArrowRight className="h-4 w-4 text-green-600" />
                                  </Button>
                                </PermissionGate>
                              )}
                              <PermissionGate module="quotations" action="delete">
                                <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(q.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>
    </DashboardLayout>
  );
};

export default Quotations;
