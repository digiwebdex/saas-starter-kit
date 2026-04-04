const router = require("express").Router();
const { authenticate, requireSuperAdmin, prisma } = require("../middleware/auth");

router.use(authenticate);

// Tenant-scoped audit logs (for tenant owners)
router.get("/", async (req, res) => {
  try {
    const where = req.userRole === "super_admin" ? {} : { tenantId: req.tenantId };
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create audit log entry (internal use, also exposed for frontend)
router.post("/", async (req, res) => {
  try {
    const { module, action, targetType, targetId, targetLabel, oldValue, newValue, metadata } = req.body;
    // Get actor info
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = req.tenantId ? await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { name: true } }) : null;

    const log = await prisma.auditLog.create({
      data: {
        actorId: req.userId,
        actorName: user?.name || "Unknown",
        actorEmail: user?.email || "",
        actorRole: user?.role || req.userRole || "",
        tenantId: req.tenantId || null,
        tenantName: tenant?.name || null,
        module, action, targetType, targetId, targetLabel,
        oldValue, newValue,
        metadata: metadata || null,
        ipAddress: req.headers["x-forwarded-for"]?.toString()?.split(",")[0] || req.ip || null,
      },
    });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
