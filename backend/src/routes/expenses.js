const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");

router.use(authenticate);

router.get("/", async (req, res) => {
  try { res.json(await prisma.expense.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id", async (req, res) => {
  try {
    const e = await prisma.expense.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!e) return res.status(404).json({ message: "Not found" });
    res.json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/", async (req, res) => {
  try { res.status(201).json(await prisma.expense.create({ data: { ...req.body, createdBy: req.userId, tenantId: req.tenantId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id", async (req, res) => {
  try {
    await prisma.expense.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.expense.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id", async (req, res) => {
  try { await prisma.expense.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/approve", async (req, res) => {
  try {
    await prisma.expense.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: "approved", approvedBy: req.userId } });
    res.json(await prisma.expense.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/reject", async (req, res) => {
  try {
    await prisma.expense.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: "rejected" } });
    res.json(await prisma.expense.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
