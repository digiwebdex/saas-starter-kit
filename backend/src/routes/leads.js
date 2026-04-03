const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");

router.use(authenticate);

router.get("/", async (req, res) => {
  try { res.json(await prisma.lead.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/check-duplicate", async (req, res) => {
  try {
    const { email, phone } = req.query;
    const client = await prisma.client.findFirst({ where: { tenantId: req.tenantId, OR: [{ email: email || "" }, { phone: phone || "" }] } });
    res.json({ exists: !!client, client: client || undefined });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id", async (req, res) => {
  try {
    const item = await prisma.lead.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/", async (req, res) => {
  try { res.status(201).json(await prisma.lead.create({ data: { ...req.body, tenantId: req.tenantId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id", async (req, res) => {
  try {
    await prisma.lead.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.lead.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id", async (req, res) => {
  try { await prisma.lead.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id/status", async (req, res) => {
  try {
    const old = await prisma.lead.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    await prisma.lead.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: req.body.status } });
    await prisma.leadActivity.create({ data: { leadId: req.params.id, type: "status_change", content: `Status changed from ${old.status} to ${req.body.status}`, oldStatus: old.status, newStatus: req.body.status, createdBy: req.userId } });
    res.json(await prisma.lead.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id/activities", async (req, res) => {
  try { res.json(await prisma.leadActivity.findMany({ where: { leadId: req.params.id }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/activities", async (req, res) => {
  try { res.status(201).json(await prisma.leadActivity.create({ data: { ...req.body, leadId: req.params.id, createdBy: req.userId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/convert", async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    const existing = await prisma.client.findFirst({ where: { tenantId: req.tenantId, OR: [{ email: lead.email }, { phone: lead.phone }] } });
    if (existing) return res.json(existing);
    const client = await prisma.client.create({ data: { name: lead.name, phone: lead.phone, email: lead.email, tenantId: req.tenantId } });
    await prisma.lead.update({ where: { id: lead.id }, data: { status: "won", clientId: client.id } });
    res.json(client);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id/quotations", async (req, res) => {
  try { res.json(await prisma.quotation.findMany({ where: { leadId: req.params.id, tenantId: req.tenantId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
