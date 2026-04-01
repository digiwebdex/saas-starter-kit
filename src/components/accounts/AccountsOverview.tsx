import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Wallet, BarChart3 } from "lucide-react";
import type { AccountsSummary } from "@/lib/api";

interface Props {
  summary: AccountsSummary;
  onTabChange: (tab: string) => void;
}

const statCards = (s: AccountsSummary, onTabChange: (t: string) => void) => [
  { label: "Total Receivable", value: s.totalReceivable, count: s.receivableCount, icon: DollarSign, color: "text-blue-600", tab: "receivables", prefix: "৳" },
  { label: "Total Received", value: s.totalReceived, icon: TrendingUp, color: "text-green-600", tab: "payments", prefix: "৳" },
  { label: "Total Payable", value: s.totalPayable, count: s.payableCount, icon: TrendingDown, color: "text-orange-600", tab: "payables", prefix: "৳" },
  { label: "Overdue Receivable", value: s.overdueReceivable, count: s.overdueReceivableCount, icon: AlertTriangle, color: "text-destructive", tab: "receivables", prefix: "৳" },
  { label: "Overdue Payable", value: s.overduePayable, count: s.overduePayableCount, icon: AlertTriangle, color: "text-destructive", tab: "payables", prefix: "৳" },
  { label: "Cash/Bank Balance", value: s.cashBankBalance, icon: Wallet, color: "text-primary", tab: "accounts", prefix: "৳" },
];

export default function AccountsOverview({ summary, onTabChange }: Props) {
  const cards = statCards(summary, onTabChange);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card
            key={c.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTabChange(c.tab)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${c.color}`}>
                {c.prefix}{c.value.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </div>
              {c.count !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">{c.count} invoice{c.count !== 1 ? "s" : ""}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profitability summary row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ৳{summary.totalReceived.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ৳{(summary.totalPayable + summary.totalExpenses).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Net Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
              ৳{summary.netProfit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
