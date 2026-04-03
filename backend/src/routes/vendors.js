const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");

router.use(authenticate);

// CRUD
router.get("/", async (req, res) => {
  try { res.json(await prisma.vendor.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/reports/payables", async (req, res) => {
  try { res.json(await prisma.vendorBill.findMany({ where: { tenantId: req.tenantId, status: { in: ["unpaid", "partial", "overdue"] } }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id", async (req, res) => {
  try {
    const v = await prisma.vendor.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!v) return res.status(404).json({ message: "Not found" });
    res.json(v);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/", async (req, res) => {
  try { res.status(201).json(await prisma.vendor.create({ data: { ...req.body, tenantId: req.tenantId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id", async (req, res) => {
  try {
    await prisma.vendor.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.vendor.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id", async (req, res) => {
  try { await prisma.vendor.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// Bills
router.get("/:id/bills", async (req, res) => {
  try { res.json(await prisma.vendorBill.findMany({ where: { vendorId: req.params.id, tenantId: req.tenantId }, include: { payments: true }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/bills", async (req, res) => {
  try { res.status(201).json(await prisma.vendorBill.create({ data: { ...req.body, vendorId: req.params.id, tenantId: req.tenantId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id/bills/:billId", async (req, res) => {
  try {
    await prisma.vendorBill.updateMany({ where: { id: req.params.billId, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.vendorBill.findFirst({ where: { id: req.params.billId } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/bills/:billId", async (req, res) => {
  try { await prisma.vendorBill.deleteMany({ where: { id: req.params.billId, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/bills/:billId/payments", async (req, res) => {
  try {
    const payment = await prisma.vendorBillPayment.create({ data: { ...req.body, billId: req.params.billId } });
    // Update bill paid/due amounts
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.billId }, include: { payments: true } });
    const paid = bill.payments.reduce((s, p) => s + p.amount, 0);
    await prisma.vendorBill.update({ where: { id: req.params.billId }, data: { paidAmount: paid, dueAmount: bill.totalAmount - paid, status: paid >= bill.totalAmount ? "paid" : paid > 0 ? "partial" : "unpaid" } });
    res.status(201).json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Notes
router.get("/:id/notes", async (req, res) => {
  try { res.json(await prisma.vendorNote.findMany({ where: { vendorId: req.params.id }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/notes", async (req, res) => {
  try { res.status(201).json(await prisma.vendorNote.create({ data: { ...req.body, vendorId: req.params.id, createdBy: req.userId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
