import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe, Trash2, Copy, CheckCircle, AlertCircle, ExternalLink, ShieldCheck, Loader2, RefreshCw, Lock, Search, XCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateVerificationToken, verifyDomainDns, checkDomainARecord, requestSslCertificate, generateSslCommand } from "@/lib/domainVerification";
import { getPlan, getDomainLimitLabel, type PlanType } from "@/lib/plans";

// DNS check interval in milliseconds (3 minutes)
const DNS_CHECK_INTERVAL = 3 * 60 * 1000;

// VPS IP — in production, fetch from admin settings API
const VPS_IP = import.meta.env.VITE_VPS_IP || "";

interface TenantDomain {
  id: string;
  tenantId: string;
  tenantName: string;
  domain: string;
  wwwRedirect: "www-to-root" | "root-to-www";
  status: "active" | "pending" | "error";
  sslStatus: "active" | "pending" | "none";
  verificationStatus: "unverified" | "verifying" | "verified";
  verificationToken: string;
  lastDnsCheck?: string;
  addedAt: string;
}

const mockTenants = [
  { id: "t1", name: "Acme Travel", plan: "pro" as PlanType },
  { id: "t2", name: "Globe Tours", plan: "business" as PlanType },
  { id: "t3", name: "Star Holidays", plan: "basic" as PlanType },
];

const mockDomains: TenantDomain[] = [
  {
    id: "d1",
    tenantId: "t1",
    tenantName: "Acme Travel",
    domain: "acmetravel.com",
    status: "active",
    sslStatus: "active",
    verificationStatus: "verified",
    verificationToken: "tas-verify-abc123def456gh",
    addedAt: "2025-12-01",
  },
  {
    id: "d2",
    tenantId: "t2",
    tenantName: "Globe Tours",
    domain: "globetours.net",
    status: "pending",
    sslStatus: "pending",
    verificationStatus: "unverified",
    verificationToken: "tas-verify-xyz789mno012pq",
    addedAt: "2026-03-28",
  },
];

const AdminDomains = () => {
  const [domains, setDomains] = useState<TenantDomain[]>(mockDomains);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyDialogDomain, setVerifyDialogDomain] = useState<TenantDomain | null>(null);
  const [form, setForm] = useState({ tenantId: "", domain: "" });
  const [verifying, setVerifying] = useState<string | null>(null);
  const [sslDialogDomain, setSslDialogDomain] = useState<TenantDomain | null>(null);
  const [sslGenerating, setSslGenerating] = useState(false);
  const [sslFallbackCommand, setSslFallbackCommand] = useState<string | null>(null);
  const [autoChecking, setAutoChecking] = useState(false);
  const [lastAutoCheck, setLastAutoCheck] = useState<string | null>(null);
  const [diagDomain, setDiagDomain] = useState<TenantDomain | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    aRecord: { found: boolean; ips: string[]; error?: string };
    ipMatch: boolean;
    ssl: { active: boolean; error?: string };
  } | null>(null);
  const domainsRef = useRef(domains);
  domainsRef.current = domains;
  const { toast } = useToast();

  // Auto-check DNS A records for all verified domains
  const runDnsStatusCheck = useCallback(async (silent = true) => {
    if (!VPS_IP) {
      if (!silent) {
        toast({
          title: "VPS IP সেট করা হয়নি",
          description: "VITE_VPS_IP env variable সেট করুন",
          variant: "destructive",
        });
      }
      return;
    }

    setAutoChecking(true);
    const currentDomains = domainsRef.current;
    const verifiedDomains = currentDomains.filter((d) => d.verificationStatus === "verified");

    if (verifiedDomains.length === 0) {
      setAutoChecking(false);
      return;
    }

    const results = await Promise.allSettled(
      verifiedDomains.map(async (d) => {
        const result = await checkDomainARecord(d.domain, VPS_IP);
        return { id: d.id, domain: d.domain, ...result };
      })
    );

    const now = new Date().toLocaleTimeString("bn-BD");
    let changed = 0;

    setDomains((prev) =>
      prev.map((d) => {
        const check = results.find(
          (r) => r.status === "fulfilled" && r.value.id === d.id
        );
        if (!check || check.status !== "fulfilled") return d;

        const { pointing } = check.value;
        const newStatus = pointing ? "active" : "pending";
        const newSsl = pointing ? "active" : d.sslStatus;

        if (d.status !== newStatus) changed++;

        return {
          ...d,
          status: newStatus as TenantDomain["status"],
          sslStatus: newSsl as TenantDomain["sslStatus"],
          lastDnsCheck: now,
        };
      })
    );

    setLastAutoCheck(now);
    setAutoChecking(false);

    if (!silent && changed > 0) {
      toast({ title: `${changed}টি ডোমেইনের স্ট্যাটাস আপডেট হয়েছে` });
    } else if (!silent && changed === 0) {
      toast({ title: "সব ডোমেইনের স্ট্যাটাস আগের মতোই আছে" });
    }
  }, [toast]);

  // Set up interval for auto-checking
  useEffect(() => {
    // Initial check after 5 seconds
    const initialTimeout = setTimeout(() => runDnsStatusCheck(true), 5000);

    const interval = setInterval(() => {
      runDnsStatusCheck(true);
    }, DNS_CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [runDnsStatusCheck]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const domainClean = form.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

    if (!form.tenantId || !domainClean) {
      toast({ title: "সব ফিল্ড পূরণ করুন", variant: "destructive" });
      return;
    }

    if (domains.some((d) => d.domain === domainClean)) {
      toast({ title: "এই ডোমেইন আগে থেকেই আছে", variant: "destructive" });
      return;
    }

    const tenant = mockTenants.find((t) => t.id === form.tenantId);
    if (!tenant) return;

    // Check plan domain limit
    const plan = getPlan(tenant.plan);
    if (plan.maxDomains === 0) {
      toast({
        title: "ডোমেইন সাপোর্ট নেই",
        description: `${tenant.name} এর "${plan.name}" প্ল্যানে কাস্টম ডোমেইন সাপোর্ট নেই। Pro বা তার উপরের প্ল্যানে আপগ্রেড করুন।`,
        variant: "destructive",
      });
      return;
    }

    if (plan.maxDomains > 0) {
      const tenantDomainCount = domains.filter((d) => d.tenantId === form.tenantId).length;
      if (tenantDomainCount >= plan.maxDomains) {
        toast({
          title: "ডোমেইন লিমিট পূর্ণ",
          description: `${tenant.name} এর "${plan.name}" প্ল্যানে সর্বোচ্চ ${plan.maxDomains}টি ডোমেইন যুক্ত করা যায়। আরো ডোমেইন যুক্ত করতে Business প্ল্যানে আপগ্রেড করুন।`,
          variant: "destructive",
        });
        return;
      }
    }
    const token = generateVerificationToken();
    const newDomain: TenantDomain = {
      id: crypto.randomUUID(),
      tenantId: form.tenantId,
      tenantName: tenant?.name || "",
      domain: domainClean,
      status: "pending",
      sslStatus: "none",
      verificationStatus: "unverified",
      verificationToken: token,
      addedAt: new Date().toISOString().split("T")[0],
    };

    setDomains((prev) => [...prev, newDomain]);
    setVerifyDialogDomain(newDomain);
    toast({ title: "ডোমেইন যুক্ত হয়েছে", description: `DNS TXT রেকর্ড যুক্ত করে ভেরিফাই করুন` });
    setForm({ tenantId: "", domain: "" });
    setDialogOpen(false);
  };

  const handleVerify = async (id: string) => {
    const domain = domains.find((d) => d.id === id);
    if (!domain) return;

    setVerifying(id);
    setDomains((prev) =>
      prev.map((d) => (d.id === id ? { ...d, verificationStatus: "verifying" as const } : d))
    );

    const result = await verifyDomainDns(domain.domain, domain.verificationToken);

    if (result.verified) {
      setDomains((prev) =>
        prev.map((d) => (d.id === id ? { ...d, verificationStatus: "verified" as const } : d))
      );
      toast({ title: "✅ ডোমেইন ভেরিফাইড!", description: `${domain.domain} সফলভাবে যাচাই হয়েছে` });
    } else {
      setDomains((prev) =>
        prev.map((d) => (d.id === id ? { ...d, verificationStatus: "unverified" as const } : d))
      );
      toast({
        title: "❌ ভেরিফিকেশন ব্যর্থ",
        description: result.error || "DNS TXT রেকর্ড মিলছে না",
        variant: "destructive",
      });
    }
    setVerifying(null);
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

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: "টোকেন কপি হয়েছে" });
  };

  const handleSslGenerate = async (domain: TenantDomain) => {
    if (domain.verificationStatus !== "verified") {
      toast({
        title: "আগে ডোমেইন ভেরিফাই করুন",
        description: "SSL সার্টিফিকেট তৈরি করতে ডোমেইন ভেরিফাইড হতে হবে",
        variant: "destructive",
      });
      return;
    }

    setSslGenerating(true);
    setSslFallbackCommand(null);

    const result = await requestSslCertificate(domain.id, domain.domain);

    if (result.success && result.method === "api") {
      // API successfully triggered certbot
      setDomains((prev) =>
        prev.map((d) =>
          d.id === domain.id ? { ...d, sslStatus: "active" as const } : d
        )
      );
      toast({ title: "✅ SSL সার্টিফিকেট তৈরি হয়েছে!", description: domain.domain });
      setSslDialogDomain(null);
    } else {
      // Fallback — show command
      setSslFallbackCommand(result.command || generateSslCommand(domain.domain));
      // Mark as pending
      setDomains((prev) =>
        prev.map((d) =>
          d.id === domain.id ? { ...d, sslStatus: "pending" as const } : d
        )
      );
    }

    setSslGenerating(false);
  };

  const copySslCommand = (domain: string) => {
    const cmd = generateSslCommand(domain);
    navigator.clipboard.writeText(cmd);
    toast({ title: "SSL কমান্ড কপি হয়েছে", description: "VPS টার্মিনালে পেস্ট করে রান করুন" });
  };

  const markSslActive = (id: string) => {
    setDomains((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, sslStatus: "active" as const } : d
      )
    );
    toast({ title: "SSL স্ট্যাটাস Active করা হয়েছে" });
    setSslDialogDomain(null);
  };

  const runDiagnostic = async (domain: TenantDomain) => {
    setDiagDomain(domain);
    setDiagRunning(true);
    setDiagResult(null);

    try {
      // Check A record
      const aResult = await checkDomainARecord(domain.domain, VPS_IP || "0.0.0.0");
      const aRecord = { found: aResult.resolvedIps.length > 0, ips: aResult.resolvedIps, error: aResult.error };
      const ipMatch = aResult.pointing;

      // Check SSL by attempting HTTPS fetch
      let ssl = { active: false, error: undefined as string | undefined };
      try {
        const sslRes = await fetch(`https://${domain.domain}`, { method: "HEAD", mode: "no-cors" });
        ssl = { active: true, error: undefined };
      } catch {
        ssl = { active: false, error: "HTTPS connection failed" };
      }

      setDiagResult({ aRecord, ipMatch, ssl });
    } catch (err: any) {
      setDiagResult({
        aRecord: { found: false, ips: [], error: err.message },
        ipMatch: false,
        ssl: { active: false, error: "Check failed" },
      });
    }

    setDiagRunning(false);
  };

  const toggleStatus = (id: string) => {
    const domain = domains.find((d) => d.id === id);
    if (!domain) return;

    if (domain.verificationStatus !== "verified" && domain.status !== "active") {
      toast({
        title: "ভেরিফিকেশন প্রয়োজন",
        description: "Active করতে হলে আগে ডোমেইন ভেরিফাই করুন",
        variant: "destructive",
      });
      return;
    }

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

  const getVerificationBadge = (status: TenantDomain["verificationStatus"]) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <ShieldCheck className="mr-1 h-3 w-3" />Verified
          </Badge>
        );
      case "verifying":
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />Checking...
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400">
            <AlertCircle className="mr-1 h-3 w-3" />Unverified
          </Badge>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
            <p className="text-muted-foreground">
              টেন্যান্টদের কাস্টম ডোমেইন ম্যানেজ করুন
              {lastAutoCheck && (
                <span className="ml-2 text-xs">• শেষ চেক: {lastAutoCheck}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => runDnsStatusCheck(false)}
              disabled={autoChecking}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${autoChecking ? "animate-spin" : ""}`} />
              {autoChecking ? "Checking..." : "Check DNS Now"}
            </Button>
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
                      {mockTenants.map((t) => {
                        const p = getPlan(t.plan);
                        return (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} <span className="text-muted-foreground">({p.name} — {getDomainLimitLabel(t.plan)})</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {form.tenantId && (() => {
                    const selectedTenant = mockTenants.find((t) => t.id === form.tenantId);
                    if (!selectedTenant) return null;
                    const plan = getPlan(selectedTenant.plan);
                    const currentCount = domains.filter((d) => d.tenantId === form.tenantId).length;
                    const canAdd = plan.maxDomains === -1 || currentCount < plan.maxDomains;
                    return (
                      <p className={`text-xs ${canAdd ? "text-muted-foreground" : "text-destructive"}`}>
                        {plan.name} প্ল্যান: {getDomainLimitLabel(selectedTenant.plan)}
                        {plan.maxDomains > 0 && ` (ব্যবহৃত: ${currentCount}/${plan.maxDomains})`}
                        {plan.maxDomains === 0 && " — আপগ্রেড প্রয়োজন"}
                      </p>
                    );
                  })()}
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
        </div>

        {/* Verification Instructions */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              ডোমেইন ভেরিফিকেশন নির্দেশনা
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p className="font-semibold text-foreground">ধাপ ১: DNS TXT রেকর্ড যুক্ত করুন</p>
            <p>আপনার DNS প্রোভাইডারে (Cloudflare / Namecheap / GoDaddy) একটি <strong>TXT Record</strong> যুক্ত করুন:</p>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 font-mono text-xs">
              <p><strong>Type:</strong> TXT</p>
              <p><strong>Name:</strong> _verify</p>
              <p><strong>Value:</strong> (নিচের টেবিলে প্রতিটি ডোমেইনের জন্য আলাদা টোকেন দেখুন)</p>
            </div>
            <p className="font-semibold text-foreground mt-2">ধাপ ২: ভেরিফাই করুন</p>
            <p>"Verify" বাটনে ক্লিক করুন। সিস্টেম DNS চেক করে ভেরিফাই করবে।</p>
            <p className="font-semibold text-foreground mt-2">ধাপ ৩: সার্ভার সেটআপ</p>
            <p>ভেরিফিকেশন সফল হলে Nginx কমান্ড কপি করে VPS-এ রান করুন, তারপর "Active" করুন।</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ DNS propagation-এ ৫–১০ মিনিট সময় লাগতে পারে। ভেরিফাই না হলে কিছুক্ষণ পর আবার চেষ্টা করুন।
            </p>
          </CardContent>
        </Card>

        {/* Verification Detail Dialog */}
        <Dialog open={!!verifyDialogDomain} onOpenChange={(open) => !open && setVerifyDialogDomain(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                ডোমেইন ভেরিফিকেশন
              </DialogTitle>
            </DialogHeader>
            {verifyDialogDomain && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <strong>{verifyDialogDomain.domain}</strong> ভেরিফাই করতে নিচের DNS TXT রেকর্ড যুক্ত করুন:
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-2 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span><strong>Type:</strong> TXT</span>
                  </div>
                  <div><strong>Name:</strong> _verify</div>
                  <div className="flex items-center gap-2">
                    <span className="break-all"><strong>Value:</strong> {verifyDialogDomain.verificationToken}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => copyToken(verifyDialogDomain.verificationToken)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  অর্থাৎ, <code className="bg-muted px-1 rounded">_verify.{verifyDialogDomain.domain}</code> → <code className="bg-muted px-1 rounded">{verifyDialogDomain.verificationToken}</code>
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVerify(verifyDialogDomain.id)}
                    disabled={verifying === verifyDialogDomain.id}
                    className="flex-1"
                  >
                    {verifying === verifyDialogDomain.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking DNS...</>
                    ) : (
                      <><ShieldCheck className="mr-2 h-4 w-4" />Verify Domain</>
                    )}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* SSL Generation Dialog */}
        <Dialog open={!!sslDialogDomain} onOpenChange={(open) => { if (!open) { setSslDialogDomain(null); setSslFallbackCommand(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                SSL Certificate — {sslDialogDomain?.domain}
              </DialogTitle>
            </DialogHeader>
            {sslDialogDomain && (
              <div className="space-y-4">
                {sslDialogDomain.sslStatus === "active" ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="font-medium">SSL ইতিমধ্যে Active আছে</p>
                    <p className="text-sm text-muted-foreground">{sslDialogDomain.domain}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      সিস্টেম প্রথমে API দিয়ে SSL তৈরি করার চেষ্টা করবে। ব্যর্থ হলে ম্যানুয়াল কমান্ড দেখাবে।
                    </p>

                    {sslFallbackCommand ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">API unavailable — ম্যানুয়াল কমান্ড ব্যবহার করুন</span>
                        </div>
                        <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
                          {sslFallbackCommand}
                        </pre>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              navigator.clipboard.writeText(sslFallbackCommand);
                              toast({ title: "কমান্ড কপি হয়েছে" });
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />Copy Command
                          </Button>
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => markSslActive(sslDialogDomain.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />Mark SSL Active
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          VPS-এ কমান্ড সফলভাবে রান করার পর "Mark SSL Active" ক্লিক করুন
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleSslGenerate(sslDialogDomain)}
                        disabled={sslGenerating}
                        className="w-full"
                      >
                        {sslGenerating ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />SSL তৈরি হচ্ছে...</>
                        ) : (
                          <><Lock className="mr-2 h-4 w-4" />Generate SSL Certificate</>
                        )}
                      </Button>
                    )}
                  </>
                )}
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">Close</Button>
                </DialogClose>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Domain Diagnostic Dialog */}
        <Dialog open={!!diagDomain} onOpenChange={(open) => { if (!open) { setDiagDomain(null); setDiagResult(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Domain Diagnostic — {diagDomain?.domain}
              </DialogTitle>
            </DialogHeader>
            {diagDomain && (
              <div className="space-y-4">
                {diagRunning ? (
                  <div className="flex flex-col items-center py-6 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">DNS ও SSL চেক হচ্ছে...</p>
                  </div>
                ) : diagResult ? (
                  <div className="space-y-3">
                    {/* A Record */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {diagResult.aRecord.found ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {diagResult.aRecord.found ? "✔ A record found" : "❌ A record not found"}
                        </p>
                        {diagResult.aRecord.ips.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Resolved IPs: {diagResult.aRecord.ips.join(", ")}
                          </p>
                        )}
                        {diagResult.aRecord.error && (
                          <p className="text-xs text-destructive">{diagResult.aRecord.error}</p>
                        )}
                      </div>
                    </div>

                    {/* IP Match */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {diagResult.ipMatch ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {diagResult.ipMatch ? "✔ IP matches VPS" : "❌ IP mismatch"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expected: {VPS_IP || "(not set)"} {diagResult.aRecord.ips.length > 0 && `→ Got: ${diagResult.aRecord.ips.join(", ")}`}
                        </p>
                      </div>
                    </div>

                    {/* SSL */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {diagResult.ssl.active ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {diagResult.ssl.active ? "✔ SSL installed" : "❌ SSL not installed"}
                        </p>
                        {diagResult.ssl.error && (
                          <p className="text-xs text-destructive">{diagResult.ssl.error}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => runDiagnostic(diagDomain)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />Re-check
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => runDiagnostic(diagDomain)}>
                    <Search className="mr-2 h-4 w-4" />Run Diagnostic
                  </Button>
                )}
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">Close</Button>
                </DialogClose>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                      <TableCell>{getVerificationBadge(d.verificationStatus)}</TableCell>
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
                            title="Run diagnostic"
                            onClick={() => runDiagnostic(d)}
                          >
                            <Search className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Verify domain"
                            onClick={() => setVerifyDialogDomain(d)}
                          >
                            <ShieldCheck className={`h-4 w-4 ${d.verificationStatus === "verified" ? "text-green-600" : "text-amber-500"}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="SSL Certificate"
                            onClick={() => { setSslFallbackCommand(null); setSslDialogDomain(d); }}
                            disabled={d.verificationStatus !== "verified"}
                          >
                            <Lock className={`h-4 w-4 ${d.sslStatus === "active" ? "text-green-600" : "text-muted-foreground"}`} />
                          </Button>
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
                            disabled={d.verificationStatus !== "verified" && d.status !== "active"}
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
