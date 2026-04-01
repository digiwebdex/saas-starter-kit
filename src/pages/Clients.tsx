import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import PermissionGate from "@/components/PermissionGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { clientApi, type Client } from "@/lib/api";
import {
  UserCheck, Plus, Search, Eye, Pencil, Trash2, Phone, Mail, CalendarIcon, CreditCard,
} from "lucide-react";

const emptyForm = {
  name: "", phone: "", email: "", alternatePhone: "", address: "",
  dateOfBirth: "", passportNumber: "", passportExpiry: "", nidNumber: "",
  nationality: "", emergencyContact: "", emergencyPhone: "", notes: "",
};

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [dobDate, setDobDate] = useState<Date | undefined>();
  const [passportExpiry, setPassportExpiry] = useState<Date | undefined>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientApi.list();
      setClients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) =>
      c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) || c.passportNumber?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDobDate(undefined);
    setPassportExpiry(undefined);
    setDialogOpen(true);
  };

  const openEdit = (c: Client) => {
    setForm({
      name: c.name, phone: c.phone || "", email: c.email || "",
      alternatePhone: c.alternatePhone || "", address: c.address || "",
      dateOfBirth: c.dateOfBirth || "", passportNumber: c.passportNumber || "",
      passportExpiry: c.passportExpiry || "", nidNumber: c.nidNumber || "",
      nationality: c.nationality || "", emergencyContact: c.emergencyContact || "",
      emergencyPhone: c.emergencyPhone || "", notes: c.notes || "",
    });
    setEditingId(c.id);
    setDobDate(c.dateOfBirth ? new Date(c.dateOfBirth) : undefined);
    setPassportExpiry(c.passportExpiry ? new Date(c.passportExpiry) : undefined);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      dateOfBirth: dobDate ? format(dobDate, "yyyy-MM-dd") : "",
      passportExpiry: passportExpiry ? format(passportExpiry, "yyyy-MM-dd") : "",
    };
    try {
      if (editingId) {
        const updated = await clientApi.update(editingId, payload);
        setClients((p) => p.map((c) => (c.id === editingId ? { ...c, ...updated } : c)));
        toast({ title: "Client updated" });
      } else {
        const created = await clientApi.create(payload as any);
        setClients((p) => [created, ...p]);
        toast({ title: "Client created" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await clientApi.delete(id);
      setClients((p) => p.filter((c) => c.id !== id));
      toast({ title: "Client deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const DatePick = ({ label, date, onChange }: { label: string; date?: Date; onChange: (d?: Date) => void }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><UserCheck className="h-8 w-8" /> Clients</h1>
            <p className="text-muted-foreground">Manage your client database</p>
          </div>
          <PermissionGate module="clients" action="create">
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Client</Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, phone, passport..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchClients} />
        ) : clients.length === 0 ? (
          <EmptyState icon={UserCheck} title="No clients yet" description="Add your first client to get started" actionLabel="Add Client" onAction={openNew} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Passport</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No clients found.</TableCell></TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/clients/${c.id}`)}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs text-muted-foreground">
                            {c.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</div>}
                            {c.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.passportNumber ? (
                            <div className="flex items-center gap-1 text-xs"><CreditCard className="h-3 w-3" /> {c.passportNumber}</div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{c.nationality || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {c.tags?.map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`/clients/${c.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <PermissionGate module="clients" action="edit">
                              <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(c)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </PermissionGate>
                            <PermissionGate module="clients" action="delete">
                              <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Client Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit Client" : "New Client"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Alternate Phone</Label><Input value={form.alternatePhone} onChange={(e) => setForm((f) => ({ ...f, alternatePhone: e.target.value }))} /></div>
                <div className="md:col-span-2 space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pt-2">Identity & Documents</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePick label="Date of Birth" date={dobDate} onChange={setDobDate} />
                <div className="space-y-2"><Label>Nationality</Label><Input value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Passport Number</Label><Input value={form.passportNumber} onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))} /></div>
                <DatePick label="Passport Expiry" date={passportExpiry} onChange={setPassportExpiry} />
                <div className="space-y-2"><Label>NID Number</Label><Input value={form.nidNumber} onChange={(e) => setForm((f) => ({ ...f, nidNumber: e.target.value }))} /></div>
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pt-2">Emergency Contact</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Contact Name</Label><Input value={form.emergencyContact} onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Contact Phone</Label><Input value={form.emergencyPhone} onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingId ? "Update" : "Create"} Client</Button>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Clients;
