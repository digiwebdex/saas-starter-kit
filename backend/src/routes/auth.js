const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticate, prisma, SECRET } = require("../middleware/auth");

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role }, SECRET, { expiresIn: "7d" });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register (creates tenant + user with 14-day Pro trial)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, tenantName } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);

    // 14-day Pro trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Generate slug from tenant name
    const rawSlug = (tenantName || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    let slug = rawSlug;
    let suffix = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${rawSlug}-${suffix++}`;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName || name + "'s Agency",
        slug,
        subscriptionPlan: "pro",
        subscriptionStatus: "trial",
        subscriptionExpiry: trialEnd,
      },
    });
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "tenant_owner", tenantId: tenant.id },
    });
    await prisma.tenant.update({ where: { id: tenant.id }, data: { ownerId: user.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id, actorName: name, actorEmail: email, actorRole: "tenant_owner",
        tenantId: tenant.id, tenantName: tenant.name,
        module: "auth", action: "created",
        targetType: "tenant", targetId: tenant.id, targetLabel: tenant.name,
        newValue: "pro (14-day trial)",
      },
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role }, SECRET, { expiresIn: "7d" });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
