const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");

router.use(authenticate);

router.get("/", async (req, res) => {
  try { res.json(await prisma.account.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/summary", async (req, res) => {
  try {
    const tid = req.tenantId;
    const [invoices, vendorBills, accounts, expenses] = await Promise.all([
      prisma.invoice.findMany({ where: { tenantId: tid } }),
      prisma.vendorBill.findMany({ where: { tenantId: tid } }),
      prisma.account.findMany({ where: { tenantId: tid, status: "active" } }),
      prisma.expense.findMany({ where: { tenantId: tid, status: "approved" } }),
    ]);
    const totalReceivable = invoices.reduce((s, i) => s + i.dueAmount, 0);
    const totalReceived = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalPayable = vendorBills.reduce((s, b) => s + b.dueAmount, 0);
    const overdue = invoices.filter(i => i.dueDate && i.dueDate < new Date().toISOString().slice(0, 10) && i.dueAmount > 0);
    const overdueP = vendorBills.filter(b => b.dueDate && b.dueDate < new Date().toISOString().slice(0, 10) && b.dueAmount > 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({
      totalReceivable, totalReceived, totalPayable,
      overdueReceivable: overdue.reduce((s, i) => s + i.dueAmount, 0),
      overduePayable: overdueP.reduce((s, b) => s + b.dueAmount, 0),
      cashBankBalance: accounts.reduce((s, a) => s + a.balance, 0),
      totalExpenses, netProfit: totalReceived - totalPayable - totalExpenses,
      receivableCount: invoices.filter(i => i.dueAmount > 0).length,
      payableCount: vendorBills.filter(b => b.dueAmount > 0).length,
      overdueReceivableCount: overdue.length,
      overduePayableCount: overdueP.length,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/ledger", async (req, res) => {
  try { res.json(await prisma.transaction.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/profitability", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ where: { tenantId: req.tenantId } });
    const result = bookings.map(b => ({
      bookingId: b.id, bookingTitle: b.title || "", clientName: b.clientName || "",
      sellingAmount: b.amount, vendorCosts: b.cost, expenses: 0,
      grossProfit: b.profit, marginPercent: b.amount > 0 ? (b.profit / b.amount) * 100 : 0,
      status: b.status, date: b.createdAt.toISOString(),
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id", async (req, res) => {
  try {
    const a = await prisma.account.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/", async (req, res) => {
  try { res.status(201).json(await prisma.account.create({ data: { ...req.body, tenantId: req.tenantId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id", async (req, res) => {
  try {
    await prisma.account.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.account.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id", async (req, res) => {
  try { await prisma.account.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
