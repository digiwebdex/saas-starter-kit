const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { authenticate, prisma } = require("../middleware/auth");

const upload = multer({ dest: process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads") });
router.use(authenticate);

router.get("/", async (req, res) => {
  try { res.json(await prisma.invoice.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id", async (req, res) => {
  try {
    const inv = await prisma.invoice.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!inv) return res.status(404).json({ message: "Not found" });
    res.json(inv);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/", async (req, res) => {
  try {
    const count = await prisma.invoice.count({ where: { tenantId: req.tenantId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;
    res.status(201).json(await prisma.invoice.create({ data: { ...req.body, invoiceNumber, createdBy: req.userId, tenantId: req.tenantId } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id", async (req, res) => {
  try {
    await prisma.invoice.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.invoice.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id", async (req, res) => {
  try { await prisma.invoice.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id/status", async (req, res) => {
  try {
    const old = await prisma.invoice.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    await prisma.invoice.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: req.body.status, ...(req.body.status === "cancelled" ? { cancelReason: req.body.cancelReason } : {}) } });
    await prisma.invoiceAuditEvent.create({ data: { invoiceId: req.params.id, type: "status_change", content: `Status: ${old.status} → ${req.body.status}`, oldStatus: old.status, newStatus: req.body.status, createdBy: req.userId } });
    res.json(await prisma.invoice.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Payments
router.get("/:id/payments", async (req, res) => {
  try { res.json(await prisma.payment.findMany({ where: { invoiceId: req.params.id }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/payments", async (req, res) => {
  try {
    const payment = await prisma.payment.create({ data: { ...req.body, invoiceId: req.params.id, receivedBy: req.userId, tenantId: req.tenantId } });
    // Update invoice amounts
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { payments: true } });
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    await prisma.invoice.update({ where: { id: req.params.id }, data: { paidAmount: paid, dueAmount: inv.totalAmount - paid, status: paid >= inv.totalAmount ? "paid" : paid > 0 ? "partial" : "unpaid" } });
    // Update booking
    if (req.body.bookingId) {
      const bInvoices = await prisma.invoice.findMany({ where: { bookingId: req.body.bookingId } });
      const bPaid = bInvoices.reduce((s, i) => s + i.paidAmount, 0);
      const bTotal = bInvoices.reduce((s, i) => s + i.totalAmount, 0);
      await prisma.booking.update({ where: { id: req.body.bookingId }, data: { paidAmount: bPaid, dueAmount: bTotal - bPaid, paymentStatus: bPaid >= bTotal ? "paid" : bPaid > 0 ? "partial" : "unpaid" } });
    }
    await prisma.invoiceAuditEvent.create({ data: { invoiceId: req.params.id, type: "payment", content: `Payment of ${payment.amount} received via ${payment.method}`, amount: payment.amount, createdBy: req.userId } });
    res.status(201).json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/payments/:payId", async (req, res) => {
  try { await prisma.payment.delete({ where: { id: req.params.payId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/payments/:payId/proof", upload.single("file"), async (req, res) => {
  try {
    await prisma.payment.update({ where: { id: req.params.payId }, data: { proofUrl: `/uploads/${req.file.filename}` } });
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Refunds
router.get("/:id/refunds", async (req, res) => {
  try { res.json(await prisma.invoiceRefund.findMany({ where: { invoiceId: req.params.id }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/refunds", async (req, res) => {
  try {
    const refund = await prisma.invoiceRefund.create({ data: { ...req.body, invoiceId: req.params.id, processedBy: req.userId } });
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { refunds: true } });
    const refunded = inv.refunds.reduce((s, r) => s + r.amount, 0);
    await prisma.invoice.update({ where: { id: req.params.id }, data: { refundedAmount: refunded, status: refunded >= inv.totalAmount ? "refunded" : inv.status } });
    res.status(201).json(refund);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Audit
router.get("/:id/audit", async (req, res) => {
  try { res.json(await prisma.invoiceAuditEvent.findMany({ where: { invoiceId: req.params.id }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
