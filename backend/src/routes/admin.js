const router = require("express").Router();
const { authenticate, requireSuperAdmin, prisma } = require("../middleware/auth");

router.use(authenticate);
router.use(requireSuperAdmin);

// All tenants
router.get("/tenants", async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { users: true, bookings: true } } } });
    res.json(tenants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/tenants/:id", async (req, res) => {
  try {
    const t = await prisma.tenant.findUnique({ where: { id: req.params.id }, include: { users: { select: { id: true, name: true, email: true, role: true, createdAt: true } } } });
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/tenants/:id", async (req, res) => {
  try { res.json(await prisma.tenant.update({ where: { id: req.params.id }, data: req.body })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// Dashboard
router.get("/stats", async (req, res) => {
  try {
    const [tenants, users, bookings, revenue] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);
    res.json({ totalTenants: tenants, totalUsers: users, totalBookings: bookings, totalRevenue: revenue._sum.amount || 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Payment requests
router.get("/payment-requests", async (req, res) => {
  try { res.json(await prisma.paymentRequest.findMany({ orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/payment-requests/:id", async (req, res) => {
  try {
    const pr = await prisma.paymentRequest.update({ where: { id: req.params.id }, data: req.body });
    if (req.body.status === "approved") {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (pr.plan === "enterprise" ? 12 : pr.plan === "business" ? 12 : pr.plan === "pro" ? 6 : 1));
      await prisma.tenant.update({ where: { id: pr.tenantId }, data: { subscriptionPlan: pr.plan, subscriptionStatus: "active", subscriptionExpiry: endDate } });
    }
    res.json(pr);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
