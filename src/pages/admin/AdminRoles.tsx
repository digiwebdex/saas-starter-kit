import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Save, Loader2, Eye, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_PERMISSIONS,
  ROLE_METADATA,
  MODULE_METADATA,
  ALL_ACTIONS_LIST,
  ACTION_LABELS,
  getRoleMeta,
  type AppRole,
  type Module,
  type Action,
  type PermissionMatrix,
} from "@/lib/permissions";

const ALL_ROLES: AppRole[] = ["super_admin", "tenant_owner", "manager", "sales_agent", "accountant", "operations"];

const AdminRoles = () => {
  const [permOverrides, setPermOverrides] = useState<Record<AppRole, PermissionMatrix>>(
    JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
  );
  const [saving, setSaving] = useState(false);
  const [viewRole, setViewRole] = useState<AppRole | null>(null);
  const { toast } = useToast();

  const togglePerm = (role: AppRole, module: Module, action: Action) => {
    if (role === "super_admin") return; // Can't modify super admin
    setPermOverrides((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: {
          ...prev[role]?.[module],
          [action]: !prev[role]?.[module]?.[action],
        },
      },
    }));
  };

  const resetRole = (role: AppRole) => {
    setPermOverrides((prev) => ({
      ...prev,
      [role]: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS[role])),
    }));
    toast({ title: `${getRoleMeta(role).label} permissions reset to defaults` });
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast({ title: "Permission configuration saved", description: "Changes will apply to all tenants." });
  };

  const countPerms = (role: AppRole) => {
    let total = 0;
    const perms = permOverrides[role];
    if (!perms) return 0;
    for (const mod of Object.values(perms)) {
      for (const val of Object.values(mod)) {
        if (val) total++;
      }
    }
    return total;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" /> Role & Permission Management
            </h1>
            <p className="text-muted-foreground">Configure permissions for each role across all modules</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Changes
          </Button>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_METADATA.map((role) => (
            <Card key={role.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${role.color}`}>
                      {role.label}
                    </span>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{countPerms(role.id)}</p>
                    <p className="text-[10px] text-muted-foreground">permissions</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewRole(role.id)}>
                    <Eye className="mr-1 h-3.5 w-3.5" /> View
                  </Button>
                  {role.id !== "super_admin" && (
                    <Button variant="ghost" size="sm" onClick={() => resetRole(role.id)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Per-Role Tabs with editable matrix */}
        <Tabs defaultValue="tenant_owner" className="space-y-4">
          <TabsList className="flex-wrap">
            {ALL_ROLES.filter((r) => r !== "super_admin").map((r) => {
              const meta = getRoleMeta(r);
              return (
                <TabsTrigger key={r} value={r} className="gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full`} style={{ background: "currentColor" }} />
                  {meta.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ALL_ROLES.filter((r) => r !== "super_admin").map((role) => (
            <TabsContent key={role} value={role}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleMeta(role).color}`}>
                      {getRoleMeta(role).label}
                    </span>
                    Permission Editor
                  </CardTitle>
                  <CardDescription>{getRoleMeta(role).description}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Module</TableHead>
                        {ALL_ACTIONS_LIST.map((a) => (
                          <TableHead key={a} className="text-center text-xs min-w-[70px]">{ACTION_LABELS[a]}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MODULE_METADATA.filter((m) => m.id !== "admin_panel").map((mod) => {
                        const perms = permOverrides[role]?.[mod.id as Module] || {};
                        return (
                          <TableRow key={mod.id}>
                            <TableCell>
                              <p className="font-medium text-sm">{mod.label}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{mod.category}</p>
                            </TableCell>
                            {ALL_ACTIONS_LIST.map((action) => (
                              <TableCell key={action} className="text-center">
                                <div className="flex justify-center">
                                  <Switch
                                    checked={perms[action] ?? false}
                                    onCheckedChange={() => togglePerm(role, mod.id as Module, action)}
                                  />
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* View Role Dialog */}
        <Dialog open={!!viewRole} onOpenChange={(open) => { if (!open) setViewRole(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {viewRole && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleMeta(viewRole).color}`}>
                      {getRoleMeta(viewRole).label}
                    </span>
                    Full Permission View
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">{getRoleMeta(viewRole).description}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {ALL_ACTIONS_LIST.map((a) => (
                        <TableHead key={a} className="text-center text-xs">{ACTION_LABELS[a]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULE_METADATA.map((mod) => {
                      const perms = permOverrides[viewRole]?.[mod.id as Module] || {};
                      return (
                        <TableRow key={mod.id}>
                          <TableCell className="font-medium text-sm">{mod.label}</TableCell>
                          {ALL_ACTIONS_LIST.map((action) => (
                            <TableCell key={action} className="text-center">
                              {perms[action] ? (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">✓</span>
                              ) : (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground/30 text-xs">✗</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <DialogClose asChild><Button variant="outline" className="w-full mt-4">Close</Button></DialogClose>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
