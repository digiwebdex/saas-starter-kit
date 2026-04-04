// Cron-safe subscription/trial expiry processing
// Protected by CRON_SECRET env var — not by JWT
const router = require("express").Router();
const { prisma } = require("../middleware/auth");

const CRON_SECRET = process.env.CRON_SECRET || "";

// Middleware: verify cron secret
function verifyCronSecret(req, res, next) {
  const token = req.headers["x-cron-secret"] || req.query.secret;
  if (!CRON_SECRET || CRON_SECRET.length < 8) {
    return res.status(500).json({ message: "CRON_SECRET not configured" });
  }
  if (token !== CRON_SECRET) {
    return res.status(401).json({ message: "Invalid cron secret" });
  }
  next();
}

router.use(verifyCronSecret);

// POST /api/cron/process-expiry
// Finds tenants with expired trials or subscriptions and marks them expired
router.post("/process-expiry", async (req, res) => {
  try {
    const now = new Date();

    // Find tenants where subscription is active/trial but expiry has passed
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        subscriptionExpiry: { lt: now },
        subscriptionStatus: { in: ["active", "trial"] },
      },
      select: { id: true, name: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionExpiry: true },
    });

    let processed = 0;
    for (const tenant of expiredTenants) {
      const oldStatus = tenant.subscriptionStatus;

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: "expired" },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          actorId: "system", actorName: "System Cron", actorEmail: "system@travelagencyweb.com", actorRole: "system",
          tenantId: tenant.id, tenantName: tenant.name,
          module: "subscription", action: "auto_expired",
          targetType: "tenant", targetId: tenant.id, targetLabel: tenant.name,
          oldValue: oldStatus, newValue: "expired",
          metadata: { plan: tenant.subscriptionPlan, expiry: tenant.subscriptionExpiry?.toISOString() },
        },
      }).catch(() => {});

      processed++;
    }

    res.json({ processed, total: expiredTenants.length, timestamp: now.toISOString() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
