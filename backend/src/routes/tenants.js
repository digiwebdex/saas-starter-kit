const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");

router.use(authenticate);

router.get("/me", async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch("/me", async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({ where: { id: req.tenantId }, data: req.body });
    res.json(tenant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/me/members", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post("/me/members", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const { email, role, name } = req.body;
    const hashed = await bcrypt.hash("changeme123", 10);
    const user = await prisma.user.create({
      data: { name: name || email.split("@")[0], email, password: hashed, role: role || "sales_agent", tenantId: req.tenantId },
    });
    const { password: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete("/me/members/:userId", async (req, res) => {
  try {
    await prisma.user.deleteMany({ where: { id: req.params.userId, tenantId: req.tenantId } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
