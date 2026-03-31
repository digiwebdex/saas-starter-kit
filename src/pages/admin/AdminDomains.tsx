import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe, Trash2, Copy, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TenantDomain {
  id: string;
  tenantId: string;
  tenantName: string;
  domain: string;
  status: "active" | "pending" | "error";
  sslStatus: "active" | "pending" | "none";
  addedAt: string;
}

const mockTenants = [
  { id: "t1", name: "Acme Travel" },
  { id: "t2", name: "Globe Tours" },
  { id: "t3", name: "Star Holidays" },
];

const mockDomains: TenantDomain[] = [
  {
    id: "d1",
    tenantId: "t1",
    tenantName: "Acme Travel",
    domain: "acmetravel.com",
    status: "active",
    sslStatus: "active",
    addedAt: "2025-12-01",
  },
  {
    id: "d2",
    tenantId: "t2",
    tenantName: "Globe Tours",
    domain: "globetours.net",
    status: "pending",
    sslStatus: "pending",
    addedAt: "2026-03-28",
  },
];

const AdminDomains = () => {
  const [domains, setDomains] = useState<TenantDomain[]>(mockDomains);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tenantId: "", domain: "" });
  const { toast } = useToast();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const domainClean = form.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

    if (!form.tenantId || !domainClean) {
      toast({ title: "সব ফিল্ড পূরণ করুন", variant: "destructive" });
      return;
    }

    // Check duplicate
    if (domains.some((d) => d.domain === domainClean)) {
      toast({ title: "এই ডোমেইন আগে থেকেই আছে", variant: "destructive" });
      return;
    }

    const tenant = mockTenants.find((t) => t.id === form.tenantId);
    const newDomain: TenantDomain = {
      id: crypto.randomUUID(),
      tenantId: form.tenantId,
      tenantName: tenant?.name || "",
      domain: domainClean,
      status: "pending",
      sslStatus: "none",
      addedAt: new Date().toISOString().split("T")[0],
    };

    setDomains((prev) => [...prev, newDomain]);
    toast({ title: "ডোমেইন যুক্ত হয়েছে", description: `${domainClean} → ${tenant?.name}` });
    setForm({ tenantId: "", domain: "" });
    setDialogOpen(false);
  };

  const handleRemove = (id: string) => {
    const d = domains.find((x) => x.id === id);
    setDomains((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "ডোমেইন সরানো হয়েছে", description: d?.domain });
  };

  const copyNginxCommand = (domain: string) => {
    const cmd = `# 1. Nginx config তৈরি করুন
cat > /etc/nginx/sites-available/${domain} << 'EOF'
server {
    listen 80;
    server_name ${domain} www.${domain};

    location /api/ {
        proxy_pass http://127.0.0.1:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    root /var/www/tas-saas-frontend/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
EOF

# 2. Enable & SSL
ln -s /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
sudo certbot --nginx -d ${domain} -d www.${domain}`;

    navigator.clipboard.writeText(cmd);
    toast({ title: "কমান্ড কপি হয়েছে", description: "VPS টার্মিনালে পেস্ট করুন" });
  };

  const toggleStatus = (id: string) => {
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const newStatus = d.status === "active" ? "pending" : "active";
        const newSsl = newStatus === "active" ? "active" : d.sslStatus;
        return { ...d, status: newStatus, sslStatus: newSsl };
      })
    );
    toast({ title: "স্ট্যাটাস আপডেট হয়েছে" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
            <p className="text-muted-foreground">টেন্যান্টদের কাস্টম ডোমেইন ম্যানেজ করুন</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Domain</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন ডোমেইন যুক্ত করুন</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>টেন্যান্ট / কোম্পানি</Label>
                  <Select value={form.tenantId} onValueChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="কোম্পানি সিলেক্ট করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ডোমেইন</Label>
                  <Input
                    placeholder="example.com"
                    value={form.domain}
                    onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                    maxLength={253}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    শুধু ডোমেইন নাম লিখুন, http:// বা www ছাড়া
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Globe className="mr-2 h-4 w-4" />Add Domain
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Setup Instructions */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              ডোমেইন সেটআপ নির্দেশনা
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>১.</strong> টেন্যান্ট তাদের ডোমেইনের DNS-এ <strong>A Record</strong> যুক্ত করবে → আপনার VPS IP-তে পয়েন্ট করবে</p>
            <p><strong>২.</strong> নিচের টেবিলে "Copy Setup" বাটনে ক্লিক করে Nginx কমান্ড কপি করুন</p>
            <p><strong>৩.</strong> VPS টার্মিনালে পেস্ট করে রান করুন (SSL সহ)</p>
            <p><strong>৪.</strong> ব্যাকেন্ড ডাটাবেসে টেন্যান্টের <code className="bg-muted px-1 rounded">customDomain</code> আপডেট করুন</p>
            <p><strong>৫.</strong> স্ট্যাটাস "Active" করুন</p>
          </CardContent>
        </Card>

        {/* Domains Table */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Domains ({domains.length})</CardTitle>
            <CardDescription>প্রতিটি টেন্যান্টের কাস্টম ডোমেইন তালিকা</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      কোনো ডোমেইন যুক্ত হয়নি। "Add Domain" ক্লিক করুন।
                    </TableCell>
                  </TableRow>
                ) : (
                  domains.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{d.domain}</span>
                          <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{d.tenantName}</TableCell>
                      <TableCell>
                        {d.status === "active" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" />Active
                          </Badge>
                        ) : d.status === "pending" ? (
                          <Badge variant="secondary">
                            <AlertCircle className="mr-1 h-3 w-3" />Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Error</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.sslStatus === "active" ? (
                          <Badge variant="outline" className="text-green-700 border-green-300">🔒 SSL</Badge>
                        ) : d.sslStatus === "pending" ? (
                          <Badge variant="outline">⏳ Pending</Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive border-destructive/30">❌ None</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.addedAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Copy Nginx setup command"
                            onClick={() => copyNginxCommand(d.domain)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={d.status === "active" ? "Mark pending" : "Mark active"}
                            onClick={() => toggleStatus(d.id)}
                          >
                            <CheckCircle className={`h-4 w-4 ${d.status === "active" ? "text-green-600" : "text-muted-foreground"}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remove domain"
                            onClick={() => handleRemove(d.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>
    </AdminLayout>
  );
};

export default AdminDomains;
