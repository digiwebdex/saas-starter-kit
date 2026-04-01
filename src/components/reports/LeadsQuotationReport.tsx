import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import PermissionGate from "@/components/PermissionGate";
import type { Lead, Quotation } from "@/lib/api";

const PIE_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

interface Props {
  leads: Lead[];
  quotations: Quotation[];
}

export default function LeadsQuotationReport({ leads, quotations }: Props) {
  const leadData = useMemo(() => {
    const total = leads.length;
    const won = leads.filter((l) => l.status === "won").length;
    const lost = leads.filter((l) => l.status === "lost").length;
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0";

    // By source
    const sources: Record<string, { total: number; won: number }> = {};
    leads.forEach((l) => {
      const src = l.source || "Unknown";
      if (!sources[src]) sources[src] = { total: 0, won: 0 };
      sources[src].total++;
      if (l.status === "won") sources[src].won++;
    });
    const bySource = Object.entries(sources).map(([name, v]) => ({ name, ...v }));

    // By stage
    const stages = ["new", "contacted", "qualified", "quoted", "won", "lost"];
    const byStage = stages.map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: leads.filter((l) => l.status === s).length,
    })).filter((s) => s.value > 0);

    // By destination
    const dests: Record<string, number> = {};
    leads.forEach((l) => { if (l.destination) dests[l.destination] = (dests[l.destination] || 0) + 1; });
    const byDest = Object.entries(dests).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

    return { total, won, lost, conversionRate, bySource, byStage, byDest };
  }, [leads]);

  const quoteData = useMemo(() => {
    const total = quotations.length;
    const approved = quotations.filter((q) => q.status === "approved").length;
    const rejected = quotations.filter((q) => q.status === "rejected").length;
    const sent = quotations.filter((q) => q.status === "sent").length;
    const totalValue = quotations.reduce((s, q) => s + q.grandTotal, 0);
    const approvedValue = quotations.filter((q) => q.status === "approved").reduce((s, q) => s + q.grandTotal, 0);
    const convRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0";

    const byStatus = ["draft", "sent", "approved", "rejected", "expired"].map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      count: quotations.filter((q) => q.status === s).length,
      value: quotations.filter((q) => q.status === s).reduce((sum, q) => sum + q.grandTotal, 0),
    })).filter((s) => s.count > 0);

    return { total, approved, rejected, sent, totalValue, approvedValue, convRate, byStatus };
  }, [quotations]);

  const exportCsv = () => {
    const csv = ["Name,Phone,Source,Destination,Status,Assigned To",
      ...leads.map((l) => `${l.name},${l.phone},${l.source || ""},${l.destination || ""},${l.status},${l.assignedToName || ""}`)
    ].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "leads-report.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      {/* Lead Stats */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lead Analytics</h3>
        <PermissionGate module="reports" action="export">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export Leads</Button>
        </PermissionGate>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Leads</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{leadData.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Won</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{leadData.won}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lost</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{leadData.lost}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Conversion Rate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{leadData.conversionRate}%</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Leads by Stage</CardTitle></CardHeader>
          <CardContent>
            {leadData.byStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={leadData.byStage} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {leadData.byStage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No lead data</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Conversion by Source</CardTitle></CardHeader>
          <CardContent>
            {leadData.bySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leadData.bySource}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Total Leads" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  <Bar dataKey="won" name="Converted" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No source data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Quotation Stats */}
      <h3 className="text-lg font-semibold mt-6">Quotation Analytics</h3>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Quotations</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{quoteData.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{quoteData.approved}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Value</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">৳{quoteData.totalValue.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approval Rate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{quoteData.convRate}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Quotation Status Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Total Value</TableHead><TableHead className="text-right">% of Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {quoteData.byStatus.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No quotation data</TableCell></TableRow>
              ) : quoteData.byStatus.map((s) => (
                <TableRow key={s.name}>
                  <TableCell><Badge variant="secondary" className="capitalize">{s.name}</Badge></TableCell>
                  <TableCell className="text-right">{s.count}</TableCell>
                  <TableCell className="text-right font-semibold">৳{s.value.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{quoteData.totalValue > 0 ? ((s.value / quoteData.totalValue) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
