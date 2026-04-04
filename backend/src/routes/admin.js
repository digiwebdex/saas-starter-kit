const router = require("express").Router();
const { authenticate, requireSuperAdmin, prisma } = require("../middleware/auth");

router.use(authenticate);
router.use(requireSuperAdmin);

// All tenants
router.get("/tenants", async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, bookings: true } },
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      },
    });
    res.json(tenants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/tenants/:id", async (req, res) => {
  try {
    const t = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        _count: { select: { users: true, bookings: true, clients: true, invoices: true } },
      },
    });
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Only allow safe fields for admin tenant update
const ADMIN_ALLOWED_TENANT_FIELDS = [
  "name", "subscriptionPlan", "subscriptionStatus", "subscriptionExpiry",
];

router.patch("/tenants/:id", async (req, res) => {
  try {
    const data = {};
    for (const key of ADMIN_ALLOWED_TENANT_FIELDS) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    res.json(await prisma.tenant.update({ where: { id: req.params.id }, data }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const [tenants, users, bookings, revenue] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);
    res.json({
      totalTenants: tenants,
      totalUsers: users,
      totalBookings: bookings,
      totalRevenue: revenue._sum.amount || 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Payment requests
router.get("/payment-requests", async (req, res) => {
  try {
    res.json(await prisma.paymentRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { name: true } } },
    }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch("/payment-requests/:id", async (req, res) => {
  try {
    const { status, reviewerComment } = req.body;
    const updateData = { status };
    if (reviewerComment !== undefined) updateData.reviewerComment = reviewerComment;
    if (status === "approved" || status === "rejected") {
      updateData.processedAt = new Date();
    }

    const pr = await prisma.paymentRequest.update({ where: { id: req.params.id }, data: updateData });

    // If approved, activate the tenant's subscription
    if (status === "approved") {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (pr.plan === "enterprise" ? 12 : pr.plan === "business" ? 12 : pr.plan === "pro" ? 6 : 1));
      await prisma.tenant.update({
        where: { id: pr.tenantId },
        data: {
          subscriptionPlan: pr.plan,
          subscriptionStatus: "active",
          subscriptionExpiry: endDate,
        },
      });
    }

    // Audit log — subscription approval/rejection
    const actor = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    const tenant = await prisma.tenant.findUnique({ where: { id: pr.tenantId }, select: { name: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId, actorName: actor?.name || "", actorEmail: actor?.email || "", actorRole: actor?.role || "",
        tenantId: pr.tenantId, tenantName: tenant?.name || null,
        module: "subscription", action: status === "approved" ? "payment_approved" : "payment_rejected",
        targetType: "paymentRequest", targetId: pr.id, targetLabel: `${pr.plan} - ${pr.amount}`,
        newValue: JSON.stringify({ status, plan: pr.plan, amount: pr.amount, reviewerComment }),
      },
    }).catch(() => {});

    res.json(pr);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
