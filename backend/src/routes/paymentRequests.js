// Dedicated payment-request route with strict tenant isolation
const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");

router.use(authenticate);

// List — tenant can only see own requests
router.get("/", async (req, res) => {
  try {
    const items = await prisma.paymentRequest.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single — tenant-scoped
router.get("/:id", async (req, res) => {
  try {
    const item = await prisma.paymentRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create — only tenant_owner or super_admin can submit payment requests
router.post("/", async (req, res) => {
  try {
    if (!["tenant_owner", "super_admin"].includes(req.userRole)) {
      return res.status(403).json({ message: "Only tenant owner can submit payment requests" });
    }
    const { plan, amount, method, trxId, proofUrl } = req.body;
    if (!plan || !amount || !trxId) {
      return res.status(400).json({ message: "plan, amount, and trxId are required" });
    }
    const item = await prisma.paymentRequest.create({
      data: { plan, amount, method: method || "manual", trxId, proofUrl: proofUrl || null, tenantId: req.tenantId },
    });

    // Audit log
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: user?.name || "", actorEmail: user?.email || "", actorRole: user?.role || "",
        tenantId: req.tenantId, tenantName: tenant?.name || null,
        module: "subscription", action: "payment_request_created",
        targetType: "paymentRequest", targetId: item.id, targetLabel: `${plan} - ${amount}`,
        newValue: JSON.stringify({ plan, amount, method, trxId }),
      },
    }).catch(() => {});

    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Tenants cannot update/delete payment requests — admin-only via admin routes
// No PATCH or DELETE exposed here

module.exports = router;
