import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BookingType = "tour" | "ticket" | "hotel" | "visa";
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: string;
  type: BookingType;
  clientId: string;
  agentId: string;
  amount: number;
  cost: number;
  profit: number;
  status: BookingStatus;
  createdAt: string;
}

const emptyForm = { type: "tour" as BookingType, clientId: "", agentId: "", amount: 0, cost: 0, status: "pending" as BookingStatus };

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const Bookings = () => {
  const [items, setItems] = useState<Booking[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const profit = useMemo(() => form.amount - form.cost, [form.amount, form.cost]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const booking = {
      ...form,
      profit: form.amount - form.cost,
    };
    if (editingId) {
      setItems((prev) => prev.map((b) => b.id === editingId ? { ...b, ...booking } : b));
      toast({ title: "Booking updated" });
    } else {
      setItems((prev) => [...prev, { ...booking, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
      toast({ title: "Booking created" });
    }
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (b: Booking) => {
    setForm({ type: b.type, clientId: b.clientId, agentId: b.agentId, amount: b.amount, cost: b.cost, status: b.status });
    setEditingId(b.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((b) => b.id !== id));
    toast({ title: "Booking deleted", variant: "destructive" });
  };

  const totals = useMemo(() => {
    const totalAmount = items.reduce((s, b) => s + b.amount, 0);
    const totalCost = items.reduce((s, b) => s + b.cost, 0);
    return { amount: totalAmount, cost: totalCost, profit: totalAmount - totalCost };
  }, [items]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground">Manage tours, tickets, hotels & visas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Booking</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "New"} Booking</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as BookingType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tour">Tour</SelectItem>
                        <SelectItem value="ticket">Ticket</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="visa">Visa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as BookingStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))} placeholder="Client reference" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Agent ID</Label>
                    <Input value={form.agentId} onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))} placeholder="Agent reference" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" min={0} step={0.01} value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost</Label>
                    <Input type="number" min={0} step={0.01} value={form.cost || ""} onChange={(e) => setForm((f) => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Profit</Label>
                    <div className={`flex h-10 items-center rounded-md border px-3 text-sm font-semibold ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {profit.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingId ? "Update" : "Create"}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Amount</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totals.amount.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Cost</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totals.cost.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Profit</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${totals.profit >= 0 ? "text-green-600" : "text-destructive"}`}>{totals.profit.toFixed(2)}</div></CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5" />Bookings List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No bookings yet. Click "New Booking" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="capitalize font-medium">{b.type}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{b.clientId.slice(0, 8)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{b.agentId.slice(0, 8)}</TableCell>
                      <TableCell className="text-right">{b.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{b.cost.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-semibold ${b.profit >= 0 ? "text-green-600" : "text-destructive"}`}>{b.profit.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[b.status]}`}>
                          {b.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Bookings;
