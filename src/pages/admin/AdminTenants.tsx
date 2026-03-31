import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Ban, CheckCircle, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TenantRow {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  usersCount: number;
  status: "active" | "suspended";
  createdAt: string;
}

const mockTenants: TenantRow[] = [
  { id: "t1", name: "Acme Travel", ownerName: "John Doe", ownerEmail: "john@acme.com", plan: "pro", usersCount: 8, status: "active", createdAt: "2025-01-15" },
  { id: "t2", name: "Globe Tours", ownerName: "Jane Smith", ownerEmail: "jane@globe.com", plan: "basic", usersCount: 3, status: "active", createdAt: "2025-02-20" },
  { id: "t3", name: "Star Holidays", ownerName: "Ali Khan", ownerEmail: "ali@star.com", plan: "free", usersCount: 1, status: "suspended", createdAt: "2025-03-01" },
];

const AdminTenants = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRow[]>(mockTenants);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSuspend = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newStatus = t.status === "active" ? "suspended" : "active";
        toast({
          title: newStatus === "suspended" ? "Company suspended" : "Company reactivated",
          description: t.name,
          variant: newStatus === "suspended" ? "destructive" : "default",
        });
        return { ...t, status: newStatus as "active" | "suspended" };
      })
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Tenants</h1>
          <p className="text-muted-foreground">View and manage all registered companies</p>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader><CardTitle>Companies ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No tenants found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id} className={t.status === "suspended" ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{t.ownerName}</p>
                          <p className="text-xs text-muted-foreground">{t.ownerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{t.plan}</Badge></TableCell>
                      <TableCell className="text-center">{t.usersCount}</TableCell>
                      <TableCell>
                        {t.status === "active" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/tenants/${t.id}`)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSuspend(t.id)}
                            title={t.status === "active" ? "Suspend" : "Reactivate"}
                          >
                            {t.status === "active" ? (
                              <Ban className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Tenant Details</DialogTitle></DialogHeader>
            {selectedTenant && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{selectedTenant.name}</span>
                  <span className="text-muted-foreground">Owner:</span>
                  <span>{selectedTenant.ownerName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedTenant.ownerEmail}</span>
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="capitalize">{selectedTenant.plan}</span>
                  <span className="text-muted-foreground">Users:</span>
                  <span>{selectedTenant.usersCount}</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{selectedTenant.status}</span>
                  <span className="text-muted-foreground">Created:</span>
                  <span>{selectedTenant.createdAt}</span>
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{selectedTenant.id}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant={selectedTenant.status === "active" ? "destructive" : "default"}
                    className="flex-1"
                    onClick={() => { toggleSuspend(selectedTenant.id); setDetailOpen(false); }}
                  >
                    {selectedTenant.status === "active" ? (
                      <><Ban className="mr-2 h-4 w-4" />Suspend Company</>
                    ) : (
                      <><CheckCircle className="mr-2 h-4 w-4" />Reactivate Company</>
                    )}
                  </Button>
                  <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTenants;
