import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PLANS } from "@/lib/plans";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  maxBookings: number;
  maxUsers: number;
  maxClients: number;
  features: string;
  paymentGateways: string[];
  hasCustomDomain: boolean;
  hasSmsIntegration: boolean;
  hasWhatsApp: boolean;
  hasEmailNotifications: boolean;
  hasAgentCommission: boolean;
  hasAdvancedAnalytics: boolean;
  hasRefundSystem: boolean;
  hasApiAccess: boolean;
  active: boolean;
}

const defaultPlans: Plan[] = PLANS.map((p) => ({
  id: crypto.randomUUID(),
  name: p.name,
  slug: p.id,
  price: p.price === -1 ? 5000 : p.price,
  maxBookings: p.maxBookings,
  maxUsers: p.maxUsers,
  maxClients: p.maxClients,
  features: p.features.join(", "),
  paymentGateways: p.paymentGateways,
  hasCustomDomain: p.hasCustomDomain,
  hasSmsIntegration: p.hasSmsIntegration,
  hasWhatsApp: p.hasWhatsApp,
  hasEmailNotifications: p.hasEmailNotifications,
  hasAgentCommission: p.hasAgentCommission,
  hasAdvancedAnalytics: p.hasAdvancedAnalytics,
  hasRefundSystem: p.hasRefundSystem,
  hasApiAccess: p.hasApiAccess,
  active: true,
}));

const emptyForm: Omit<Plan, "id"> = {
  name: "", slug: "", price: 0, maxBookings: 0, maxUsers: 0, maxClients: 0,
  features: "", paymentGateways: ["manual"], hasCustomDomain: false,
  hasSmsIntegration: false, hasWhatsApp: false, hasEmailNotifications: false,
  hasAgentCommission: false, hasAdvancedAnalytics: false, hasRefundSystem: false,
  hasApiAccess: false, active: true,
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [form, setForm] = useState<Omit<Plan, "id">>(emptyForm);
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
    const { id, ...rest } = plan;
    setForm(rest);
    setEditingId(plan.id);
    setDialogOpen(true);
  };

  const toggleActive = (id: string) => {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, active: !p.active } : p));
  };

  const toggleGateway = (gw: string) => {
    setForm((f) => ({
      ...f,
      paymentGateways: f.paymentGateways.includes(gw)
        ? f.paymentGateways.filter((g) => g !== gw)
        : [...f.paymentGateways, gw],
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Plans</h1>
            <p className="text-muted-foreground">Configure subscription plans, pricing, and feature restrictions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Price (৳/mo)</Label>
                    <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Bookings</Label>
                    <Input type="number" value={form.maxBookings} onChange={(e) => setForm((f) => ({ ...f, maxBookings: parseInt(e.target.value) || 0 }))} placeholder="-1 = unlimited" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Users</Label>
                    <Input type="number" value={form.maxUsers} onChange={(e) => setForm((f) => ({ ...f, maxUsers: parseInt(e.target.value) || 0 }))} placeholder="-1 = unlimited" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Clients</Label>
                    <Input type="number" value={form.maxClients} onChange={(e) => setForm((f) => ({ ...f, maxClients: parseInt(e.target.value) || 0 }))} placeholder="-1 = unlimited" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Features (comma-separated)</Label>
                  <Input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="Feature A, Feature B" />
                </div>

                {/* Payment Gateways */}
                <div className="space-y-2">
                  <Label>Payment Gateways</Label>
                  <div className="flex flex-wrap gap-4">
                    {["manual", "sslcommerz", "bkash", "custom"].map((gw) => (
                      <div key={gw} className="flex items-center gap-2">
                        <Checkbox
                          checked={form.paymentGateways.includes(gw)}
                          onCheckedChange={() => toggleGateway(gw)}
                        />
                        <Label className="text-sm capitalize">{gw}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-2">
                  <Label>Feature Access</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "hasCustomDomain", label: "Custom Domain" },
                      { key: "hasEmailNotifications", label: "Email Notifications" },
                      { key: "hasSmsIntegration", label: "SMS Integration" },
                      { key: "hasWhatsApp", label: "WhatsApp" },
                      { key: "hasAgentCommission", label: "Agent Commission" },
                      { key: "hasAdvancedAnalytics", label: "Advanced Analytics" },
                      { key: "hasRefundSystem", label: "Refund System" },
                      { key: "hasApiAccess", label: "API Access" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          checked={form[key as keyof typeof form] as boolean}
                          onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                        />
                        <Label className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price (৳)</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Clients</TableHead>
                    <TableHead>Gateways</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => (
                    <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right font-semibold">৳{p.price.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{p.maxBookings === -1 ? "∞" : p.maxBookings}</TableCell>
                      <TableCell className="text-center">{p.maxUsers === -1 ? "∞" : p.maxUsers}</TableCell>
                      <TableCell className="text-center">{p.maxClients === -1 ? "∞" : p.maxClients}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.paymentGateways.map((gw) => (
                            <Badge key={gw} variant="outline" className="text-xs capitalize">{gw}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.hasCustomDomain && <Badge variant="secondary" className="text-xs">Domain</Badge>}
                          {p.hasSmsIntegration && <Badge variant="secondary" className="text-xs">SMS</Badge>}
                          {p.hasWhatsApp && <Badge variant="secondary" className="text-xs">WhatsApp</Badge>}
                          {p.hasAdvancedAnalytics && <Badge variant="secondary" className="text-xs">Analytics</Badge>}
                          {p.hasApiAccess && <Badge variant="secondary" className="text-xs">API</Badge>}
                        </div>
                      </TableCell>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
