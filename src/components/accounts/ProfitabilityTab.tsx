import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import { useNavigate } from "react-router-dom";
import type { BookingProfitability } from "@/lib/api";

interface Props {
  data: BookingProfitability[];
}

export default function ProfitabilityTab({ data }: Props) {
  const navigate = useNavigate();

  const totals = useMemo(() => ({
    selling: data.reduce((s, d) => s + d.sellingAmount, 0),
    costs: data.reduce((s, d) => s + d.vendorCosts + d.expenses, 0),
    profit: data.reduce((s, d) => s + d.grossProfit, 0),
  }), [data]);

  const avgMargin = totals.selling > 0 ? (totals.profit / totals.selling) * 100 : 0;

  const handleExport = () => {
    const csv = [
      "Booking,Client,Selling Amount,Vendor Costs,Expenses,Gross Profit,Margin %,Status",
      ...data.map((d) =>
        `${d.bookingTitle},${d.clientName},${d.sellingAmount},${d.vendorCosts},${d.expenses},${d.grossProfit},${d.marginPercent.toFixed(1)}%,${d.status}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "profitability.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid gap-3 grid-cols-4 flex-1 mr-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-lg font-bold">৳{totals.selling.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Costs</p><p className="text-lg font-bold text-orange-600">৳{totals.costs.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Gross Profit</p><p className={`text-lg font-bold ${totals.profit >= 0 ? "text-green-600" : "text-destructive"}`}>৳{totals.profit.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg Margin</p><p className="text-lg font-bold">{avgMargin.toFixed(1)}%</p></CardContent></Card>
        </div>
        <PermissionGate module="accounts" action="export">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
        </PermissionGate>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Selling</TableHead>
                <TableHead className="text-right">Vendor Costs</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Gross Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No booking profitability data available yet. Complete bookings with vendor costs to see margins.</TableCell></TableRow>
              ) : (
                data.map((d) => (
                  <TableRow key={d.bookingId} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/bookings/${d.bookingId}`)}>
                    <TableCell className="font-medium">{d.bookingTitle}</TableCell>
                    <TableCell>{d.clientName}</TableCell>
                    <TableCell className="text-right">৳{d.sellingAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-orange-600">৳{d.vendorCosts.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">৳{d.expenses.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-semibold ${d.grossProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {d.grossProfit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        ৳{d.grossProfit.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{d.marginPercent.toFixed(1)}%</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{d.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
