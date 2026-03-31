import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, DollarSign, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type AccountType = "cash" | "bank";
type TransactionType = "income" | "expense";

interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountForm, setAccountForm] = useState({ name: "", type: "cash" as AccountType, balance: 0 });
  const [txForm, setTxForm] = useState({ accountId: "", type: "income" as TransactionType, category: "", description: "", amount: 0, date: new Date().toISOString().split("T")[0] });
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const { toast } = useToast();

  // Simulate auto-creation: when adding income (from payment) or expense (from booking cost)
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const acc: Account = { id: crypto.randomUUID(), ...accountForm };
    setAccounts((prev) => [...prev, acc]);
    setAccountForm({ name: "", type: "cash", balance: 0 });
    setAccountDialogOpen(false);
    toast({ title: "Account created" });
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const tx: Transaction = { id: crypto.randomUUID(), ...txForm };
    setTransactions((prev) => [...prev, tx]);

    // Auto-update account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== txForm.accountId) return acc;
        return {
          ...acc,
          balance: txForm.type === "income" ? acc.balance + txForm.amount : acc.balance - txForm.amount,
        };
      })
    );

    const label = txForm.type === "income" ? "Income recorded" : "Expense recorded";
    toast({ title: label, description: `${txForm.amount.toFixed(2)} — ${txForm.description}` });
    setTxForm({ accountId: "", type: "income", category: "", description: "", amount: 0, date: new Date().toISOString().split("T")[0] });
    setTxDialogOpen(false);
  };

  const addAutoIncome = (accountId: string, amount: number, ref: string) => {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      accountId,
      type: "income",
      category: "Payment Received",
      description: `Payment: ${ref}`,
      amount,
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions((prev) => [...prev, tx]);
    setAccounts((prev) => prev.map((a) => a.id === accountId ? { ...a, balance: a.balance + amount } : a));
  };

  const addAutoExpense = (accountId: string, amount: number, ref: string) => {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      accountId,
      type: "expense",
      category: "Booking Cost",
      description: `Booking cost: ${ref}`,
      amount,
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions((prev) => [...prev, tx]);
    setAccounts((prev) => prev.map((a) => a.id === accountId ? { ...a, balance: a.balance - amount } : a));
  };

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || id.slice(0, 8);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Accounts & Transactions</h1>
            <p className="text-muted-foreground">Manage cash & bank accounts, track income and expenses</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="mr-2 h-4 w-4" />Add Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Account</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Cash, Business Bank" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={accountForm.type} onValueChange={(v) => setAccountForm((f) => ({ ...f, type: v as AccountType }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank">Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Opening Balance</Label>
                      <Input type="number" step={0.01} value={accountForm.balance || ""} onChange={(e) => setAccountForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Create</Button>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={accounts.length === 0}><Plus className="mr-2 h-4 w-4" />Add Transaction</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateTransaction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account</Label>
                      <Select value={txForm.accountId} onValueChange={(v) => setTxForm((f) => ({ ...f, accountId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={txForm.type} onValueChange={(v) => setTxForm((f) => ({ ...f, type: v as TransactionType }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={txForm.category} onChange={(e) => setTxForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Payment, Booking Cost" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={txForm.date} onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={txForm.description} onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))} placeholder="Details" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" min={0.01} step={0.01} value={txForm.amount || ""} onChange={(e) => setTxForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Record</Button>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Reports Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Wallet className="h-4 w-4" />Total Balance</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalBalance.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" />Total Income</CardTitle></CardHeader>
            <CardContent><CardContent><div className="text-2xl font-bold text-green-600">৳{totals.income.toFixed(2)}</div></CardContent></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Total Expense</CardTitle></CardHeader>
            <CardContent><CardContent><div className="text-2xl font-bold text-destructive">৳{totals.expense.toFixed(2)}</div></CardContent></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" />Net Balance</CardTitle></CardHeader>
            <CardContent><CardContent><div className={`text-2xl font-bold ${totals.balance >= 0 ? "text-green-600" : "text-destructive"}`}>৳{totals.balance.toFixed(2)}</div></CardContent></CardContent>
          </Card>
        </div>

        {/* Accounts */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Accounts</CardTitle></CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No accounts yet. Add a cash or bank account to get started.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{acc.name}</p>
                      <Badge variant="secondary" className="capitalize mt-1">{acc.type}</Badge>
                    </div>
                    <div className={`text-lg font-bold ${acc.balance >= 0 ? "text-green-600" : "text-destructive"}`}>
                      ৳{acc.balance.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No transactions yet. Add income or expense transactions to track your finances.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...transactions].reverse().map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {tx.type === "income" ? (
                            <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{tx.category}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                      <TableCell>{getAccountName(tx.accountId)}</TableCell>
                      <TableCell className={`text-right font-semibold ${tx.type === "income" ? "text-green-600" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "−"}৳{tx.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
