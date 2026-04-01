import { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  Search, Download, Eye, ArrowRight, Shield, FileText,
  Activity, User, Clock,
} from "lucide-react";
import {
  getAuditLogs, seedAuditLogs,
  MODULE_LABELS, ACTION_LABELS, getActionColor,
  type AuditLogEntry, type AuditModule,
} from "@/lib/auditLog";

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    seedAuditLogs();
    setLogs(getAuditLogs());
  }, []);

  const tenants = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => { if (l.tenantName) set.add(l.tenantName); });
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch = search === "" ||
        l.actorName.toLowerCase().includes(search.toLowerCase()) ||
        l.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
        (l.targetLabel || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.tenantName || "").toLowerCase().includes(search.toLowerCase()) ||
        ACTION_LABELS[l.action].toLowerCase().includes(search.toLowerCase());
      const matchModule = moduleFilter === "all" || l.module === moduleFilter;
      const matchTenant = tenantFilter === "all" || l.tenantName === tenantFilter;
      return matchSearch && matchModule && matchTenant;
    });
  }, [logs, search, moduleFilter, tenantFilter]);

  const stats = useMemo(() => {
    const moduleCounts: Record<string, number> = {};
    logs.forEach((l) => { moduleCounts[l.module] = (moduleCounts[l.module] || 0) + 1; });
    return {
      total: logs.length,
      today: logs.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
      securityEvents: logs.filter((l) => l.module === "auth").length,
      moduleCounts,
    };
  }, [logs]);

  const handleExport = () => {
    const headers = ["Timestamp", "Actor", "Email", "Role", "Tenant", "Module", "Action", "Target", "Old Value", "New Value", "IP"];
    const rows = filtered.map((l) => [
      l.timestamp, l.actorName, l.actorEmail, l.actorRole,
      l.tenantName || "", MODULE_LABELS[l.module], ACTION_LABELS[l.action],
      l.targetLabel || "", l.oldValue || "", l.newValue || "", l.ipAddress || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">Track all important actions across the platform</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Activity className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Events</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{stats.today}</p><p className="text-xs text-muted-foreground">Today</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Shield className="h-8 w-8 text-red-500" /><div><p className="text-2xl font-bold">{stats.securityEvents}</p><p className="text-xs text-muted-foreground">Auth Events</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{Object.keys(stats.moduleCounts).length}</p><p className="text-xs text-muted-foreground">Active Modules</p></div></div></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actor, target, action…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {(Object.keys(MODULE_LABELS) as AuditModule[]).map((m) => (
                <SelectItem key={m} value={m}>{MODULE_LABELS[m]} {stats.moduleCounts[m] ? `(${stats.moduleCounts[m]})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tenantFilter} onValueChange={setTenantFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Tenant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {tenants.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Log Table */}
        <Card>
          <CardHeader><CardTitle>Events ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No audit events found.</TableCell></TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString()}<br />
                        <span className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.actorName}</p>
                          <p className="text-[10px] text-muted-foreground">{log.actorRole}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.tenantName || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{MODULE_LABELS[log.module]}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getActionColor(log.action)}`}>
                          {ACTION_LABELS[log.action]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={log.targetLabel}>
                        {log.targetLabel || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.oldValue && log.newValue ? (
                          <span className="flex items-center gap-1 text-[10px]">
                            <span className="line-through text-muted-foreground">{log.oldValue}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium">{log.newValue}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedLog(log); setDetailOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
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
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Audit Event Details</DialogTitle></DialogHeader>
            {selectedLog && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  <span className="text-muted-foreground">Actor:</span>
                  <span className="font-medium">{selectedLog.actorName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedLog.actorEmail}</span>
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="outline" className="capitalize w-fit">{selectedLog.actorRole}</Badge>
                  {selectedLog.tenantName && (
                    <>
                      <span className="text-muted-foreground">Tenant:</span>
                      <span>{selectedLog.tenantName}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Module:</span>
                  <Badge variant="outline" className="w-fit">{MODULE_LABELS[selectedLog.module]}</Badge>
                  <span className="text-muted-foreground">Action:</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit ${getActionColor(selectedLog.action)}`}>
                    {ACTION_LABELS[selectedLog.action]}
                  </span>
                  {selectedLog.targetLabel && (
                    <>
                      <span className="text-muted-foreground">Target:</span>
                      <span>{selectedLog.targetLabel}</span>
                    </>
                  )}
                  {selectedLog.targetType && (
                    <>
                      <span className="text-muted-foreground">Target Type:</span>
                      <span className="capitalize">{selectedLog.targetType}</span>
                    </>
                  )}
                  {selectedLog.targetId && (
                    <>
                      <span className="text-muted-foreground">Target ID:</span>
                      <span className="font-mono text-xs">{selectedLog.targetId}</span>
                    </>
                  )}
                  {selectedLog.oldValue && (
                    <>
                      <span className="text-muted-foreground">Old Value:</span>
                      <span className="line-through text-destructive">{selectedLog.oldValue}</span>
                    </>
                  )}
                  {selectedLog.newValue && (
                    <>
                      <span className="text-muted-foreground">New Value:</span>
                      <span className="font-medium text-green-600">{selectedLog.newValue}</span>
                    </>
                  )}
                  {selectedLog.ipAddress && (
                    <>
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-mono text-xs">{selectedLog.ipAddress}</span>
                    </>
                  )}
                </div>
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Additional Data</p>
                    <div className="rounded-md border p-3 text-xs space-y-1">
                      {Object.entries(selectedLog.metadata).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogClose asChild><Button variant="outline" className="w-full">Close</Button></DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
