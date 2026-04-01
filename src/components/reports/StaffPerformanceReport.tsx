import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import PermissionGate from "@/components/PermissionGate";
import type { Lead, Booking, Quotation } from "@/lib/api";

interface Props {
  leads: Lead[];
  bookings: Booking[];
  quotations: Quotation[];
  teamMembers: { id: string; name: string }[];
}

export default function StaffPerformanceReport({ leads, bookings, quotations, teamMembers }: Props) {
  const data = useMemo(() => {
    const staffMap: Record<string, {
      name: string; leads: number; wonLeads: number; quotations: number;
      approvedQuotations: number; bookings: number; revenue: number;
    }> = {};

    const getOrCreate = (id: string, name: string) => {
      if (!staffMap[id]) staffMap[id] = { name, leads: 0, wonLeads: 0, quotations: 0, approvedQuotations: 0, bookings: 0, revenue: 0 };
      return staffMap[id];
    };

    leads.forEach((l) => {
      if (l.assignedTo) {
        const s = getOrCreate(l.assignedTo, l.assignedToName || "Unknown");
        s.leads++;
        if (l.status === "won") s.wonLeads++;
      }
    });

    bookings.forEach((b) => {
      if (b.assignedTo) {
        const s = getOrCreate(b.assignedTo, b.assignedToName || "Unknown");
        s.bookings++;
        s.revenue += b.amount;
      } else if (b.agentId) {
        const s = getOrCreate(b.agentId, b.agentName || "Unknown");
        s.bookings++;
        s.revenue += b.amount;
      }
    });

    quotations.forEach((q) => {
      if (q.createdBy) {
        const s = getOrCreate(q.createdBy, q.createdByName || "Unknown");
        s.quotations++;
        if (q.status === "approved") s.approvedQuotations++;
      }
    });

    const staffArr = Object.entries(staffMap)
      .map(([id, v]) => ({ id, ...v, conversionRate: v.leads > 0 ? ((v.wonLeads / v.leads) * 100).toFixed(1) : "0" }))
      .sort((a, b) => b.revenue - a.revenue);

    const chartData = staffArr.slice(0, 10).map((s) => ({
      name: s.name.split(" ")[0],
      leads: s.leads,
      bookings: s.bookings,
      revenue: s.revenue,
    }));

    return { staffArr, chartData };
  }, [leads, bookings, quotations]);

  const exportCsv = () => {
    const csv = ["Staff,Leads,Won Leads,Conversion %,Quotations,Approved,Bookings,Revenue",
      ...data.staffArr.map((s) => `${s.name},${s.leads},${s.wonLeads},${s.conversionRate}%,${s.quotations},${s.approvedQuotations},${s.bookings},${s.revenue}`)
    ].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "staff-performance.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" />Staff Performance</h3>
        <PermissionGate module="reports" action="export">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Staff Comparison</CardTitle></CardHeader>
        <CardContent>
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12">No staff activity data</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Detailed Staff Metrics</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead><TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Won</TableHead><TableHead className="text-right">Conv. %</TableHead>
                <TableHead className="text-right">Quotations</TableHead><TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Bookings</TableHead><TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.staffArr.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No staff data available. Assign leads and bookings to team members.</TableCell></TableRow>
              ) : data.staffArr.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{s.leads}</TableCell>
                  <TableCell className="text-right text-green-600">{s.wonLeads}</TableCell>
                  <TableCell className="text-right">{s.conversionRate}%</TableCell>
                  <TableCell className="text-right">{s.quotations}</TableCell>
                  <TableCell className="text-right text-green-600">{s.approvedQuotations}</TableCell>
                  <TableCell className="text-right font-semibold">{s.bookings}</TableCell>
                  <TableCell className="text-right font-bold">৳{s.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
