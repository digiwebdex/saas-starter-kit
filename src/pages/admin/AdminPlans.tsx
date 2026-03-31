import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  maxBookings: number;
  maxUsers: number;
  features: string;
  active: boolean;
}

const defaultPlans: Plan[] = [
  { id: "1", name: "Free", slug: "free", price: 0, maxBookings: 5, maxUsers: 1, features: "Basic Reports", active: true },
  { id: "2", name: "Basic", slug: "basic", price: 29, maxBookings: 50, maxUsers: 5, features: "Full Reports, Email Support", active: true },
  { id: "3", name: "Pro", slug: "pro", price: 79, maxBookings: -1, maxUsers: 20, features: "Advanced Analytics, Priority Support", active: true },
  { id: "4", name: "Business", slug: "business", price: 199, maxBookings: -1, maxUsers: -1, features: "Custom Integrations, Dedicated Manager, API Access", active: true },
];

const emptyForm = { name: "", slug: "", price: 0, maxBookings: 0, maxUsers: 0, features: "", active: true };

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setPlans((prev) => prev.map((p) => p.id === editingId ? { ...p, ...form } : p));
      toast({ title: "Plan updated" });
    } else {
      setPlans((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
      toast({ title: "Plan created" });
    }
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (plan: Plan) => {
    setForm({ name: plan.name, slug: plan.slug, price: plan.price, maxBookings: plan.maxBookings, maxUsers: plan.maxUsers, features: plan.features, active: plan.active });
    setEditingId(plan.id);
    setDialogOpen(true);
  };

  const toggleActive = (id: string) => {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Plans</h1>
            <p className="text-muted-foreground">Configure subscription plans and pricing</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Plan</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan Name</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price (৳/mo)</Label>
                    <Input type="number" min={0} step={1} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Bookings</Label>
                    <Input type="number" value={form.maxBookings} onChange={(e) => setForm((f) => ({ ...f, maxBookings: parseInt(e.target.value) || 0 }))} placeholder="-1 = unlimited" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Users</Label>
                    <Input type="number" value={form.maxUsers} onChange={(e) => setForm((f) => ({ ...f, maxUsers: parseInt(e.target.value) || 0 }))} placeholder="-1 = unlimited" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Features (comma-separated)</Label>
                  <Input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="Feature A, Feature B" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingId ? "Update" : "Create"}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Plans</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Max Bookings</TableHead>
                  <TableHead className="text-center">Max Users</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => (
                  <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                    <TableCell className="text-right font-semibold">${p.price}</TableCell>
                    <TableCell className="text-center">{p.maxBookings === -1 ? "∞" : p.maxBookings}</TableCell>
                    <TableCell className="text-center">{p.maxUsers === -1 ? "∞" : p.maxUsers}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{p.features}</TableCell>
                    <TableCell>
                      {p.active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(p.id)}>
                          <Check className={`h-4 w-4 ${p.active ? "text-destructive" : "text-green-600"}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
