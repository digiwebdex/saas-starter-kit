const router = require("express").Router();
const { authenticate, requireRole, requirePermission, checkPlanLimit, prisma } = require("../middleware/auth");

router.use(authenticate);

// Allowed fields for tenant self-update (prevents privilege escalation)
const ALLOWED_TENANT_FIELDS = [
  "name", "logo", "phone", "address", "city", "country",
  "currency", "timezone", "websiteConfig",
];

function pickAllowed(body, allowedFields) {
  const result = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

router.get("/me", async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch("/me", requireRole("tenant_owner"), async (req, res) => {
  try {
    const data = pickAllowed(req.body, ALLOWED_TENANT_FIELDS);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No allowed fields provided" });
    }
    const tenant = await prisma.tenant.update({ where: { id: req.tenantId }, data });
    res.json(tenant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/me/members", requirePermission("team", "view"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post("/me/members", requireRole("tenant_owner"), checkPlanLimit("users"), async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const { email, role, name } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    // Prevent creating super_admin or tenant_owner via this route
    const allowedRoles = ["manager", "sales_agent", "accountant", "operations"];
    const safeRole = allowedRoles.includes(role) ? role : "sales_agent";
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash("changeme123", 10);
    const user = await prisma.user.create({
      data: { name: name || email.split("@")[0], email, password: hashed, role: safeRole, tenantId: req.tenantId },
    });

    // Audit log
    const actor = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: actor?.name || "", actorEmail: actor?.email || "", actorRole: actor?.role || "",
        tenantId: req.tenantId, tenantName: tenant?.name || null,
        module: "team", action: "member_added",
        targetType: "user", targetId: user.id, targetLabel: user.email,
        newValue: safeRole,
      },
    }).catch(() => {});

    const { password: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete("/me/members/:userId", requireRole("tenant_owner"), async (req, res) => {
  try {
    // Prevent removing yourself
    if (req.params.userId === req.userId) {
      return res.status(400).json({ message: "Cannot remove yourself" });
    }
    await prisma.user.deleteMany({ where: { id: req.params.userId, tenantId: req.tenantId } });

    // Audit log
    const actor = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: actor?.name || "", actorEmail: actor?.email || "", actorRole: actor?.role || "",
        tenantId: req.tenantId, tenantName: tenant?.name || null,
        module: "team", action: "member_removed",
        targetType: "user", targetId: req.params.userId, targetLabel: req.params.userId,
      },
    }).catch(() => {});

    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
