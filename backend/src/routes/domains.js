const router = require("express").Router();
const { authenticate, requireSuperAdmin, prisma } = require("../middleware/auth");
const crypto = require("crypto");

router.use(authenticate);
router.use(requireSuperAdmin);

// Helper: generate verification token
function generateToken() {
  return "tas-verify-" + crypto.randomBytes(12).toString("hex").slice(0, 16);
}

// Helper: log audit
async function logDomainAudit(req, action, domain, extra = {}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true, role: true } });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId,
        actorName: user?.name || "Unknown",
        actorEmail: user?.email || "",
        actorRole: user?.role || req.userRole || "",
        tenantId: domain.tenantId || null,
        module: "domains",
        action,
        targetType: "domain",
        targetId: domain.id,
        targetLabel: domain.domain,
        ipAddress: req.headers["x-forwarded-for"]?.toString()?.split(",")[0] || req.ip || null,
        ...extra,
      },
    });
  } catch (e) { console.error("Audit log error:", e.message); }
}

// ── List all domains (with tenant info) ──
router.get("/", async (req, res) => {
  try {
    const domains = await prisma.tenantDomain.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { id: true, name: true, slug: true, subscriptionPlan: true } } },
    });
    res.json(domains);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Add domain ──
router.post("/", async (req, res) => {
  try {
    const { tenantId, domain: rawDomain, wwwRedirect } = req.body;
    if (!tenantId || !rawDomain) return res.status(400).json({ message: "tenantId and domain are required" });

    // Clean domain
    const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    if (!domain || domain.includes(" ")) return res.status(400).json({ message: "Invalid domain" });

    // Duplicate check
    const existing = await prisma.tenantDomain.findUnique({ where: { domain } });
    if (existing) return res.status(409).json({ message: "Domain already registered" });

    // Check tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Plan domain limit check
    const planLimits = { free: 0, basic: 0, pro: 1, business: 3, enterprise: -1 };
    const maxDomains = planLimits[tenant.subscriptionPlan] ?? 0;
    if (maxDomains === 0) return res.status(403).json({ message: "Current plan does not support custom domains" });
    if (maxDomains > 0) {
      const count = await prisma.tenantDomain.count({ where: { tenantId } });
      if (count >= maxDomains) return res.status(403).json({ message: `Domain limit reached (${maxDomains})` });
    }

    const token = generateToken();
    const isPrimary = (await prisma.tenantDomain.count({ where: { tenantId } })) === 0;

    const record = await prisma.tenantDomain.create({
      data: { tenantId, domain, wwwRedirect: wwwRedirect || "www-to-root", verificationToken: token, isPrimary },
      include: { tenant: { select: { id: true, name: true, slug: true, subscriptionPlan: true } } },
    });

    await logDomainAudit(req, "create", record);
    res.status(201).json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Verify domain (check DNS TXT) ──
router.post("/:id/verify", async (req, res) => {
  try {
    const dom = await prisma.tenantDomain.findUnique({ where: { id: req.params.id } });
    if (!dom) return res.status(404).json({ message: "Domain not found" });

    // Update to verifying
    await prisma.tenantDomain.update({ where: { id: dom.id }, data: { verificationStatus: "verifying" } });

    // Check DNS via Google DNS-over-HTTPS
    const lookupDomain = `_verify.${dom.domain}`;
    let verified = false;
    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(lookupDomain)}&type=TXT`);
      if (dnsRes.ok) {
        const data = await dnsRes.json();
        if (data.Answer && data.Answer.length > 0) {
          verified = data.Answer.some(record => {
            const value = record.data?.replace(/^"|"$/g, "").trim();
            return value === dom.verificationToken;
          });
        }
      }
    } catch (e) { /* DNS check failed */ }

    const newStatus = verified ? "verified" : "unverified";
    const updated = await prisma.tenantDomain.update({
      where: { id: dom.id },
      data: { verificationStatus: newStatus, lastDnsCheck: new Date() },
      include: { tenant: { select: { id: true, name: true, slug: true, subscriptionPlan: true } } },
    });

    await logDomainAudit(req, verified ? "verify" : "verify_failed", updated, {
      newValue: newStatus,
    });

    res.json({ verified, domain: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Update SSL status ──
router.patch("/:id/ssl", async (req, res) => {
  try {
    const { sslStatus } = req.body;
    if (!["active", "pending", "none"].includes(sslStatus)) {
      return res.status(400).json({ message: "Invalid sslStatus" });
    }
    const dom = await prisma.tenantDomain.findUnique({ where: { id: req.params.id } });
    if (!dom) return res.status(404).json({ message: "Domain not found" });

    const updated = await prisma.tenantDomain.update({
      where: { id: req.params.id },
      data: { sslStatus },
      include: { tenant: { select: { id: true, name: true, slug: true, subscriptionPlan: true } } },
    });

    await logDomainAudit(req, "update", updated, { oldValue: dom.sslStatus, newValue: sslStatus });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Activate / deactivate domain ──
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "pending", "error"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const dom = await prisma.tenantDomain.findUnique({ where: { id: req.params.id } });
    if (!dom) return res.status(404).json({ message: "Domain not found" });

    if (status === "active" && dom.verificationStatus !== "verified") {
      return res.status(400).json({ message: "Domain must be verified before activation" });
    }

    const updated = await prisma.tenantDomain.update({
      where: { id: req.params.id },
      data: { status },
      include: { tenant: { select: { id: true, name: true, slug: true, subscriptionPlan: true } } },
    });

    await logDomainAudit(req, status === "active" ? "activate" : "deactivate", updated);
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Set primary domain ──
router.patch("/:id/primary", async (req, res) => {
  try {
    const dom = await prisma.tenantDomain.findUnique({ where: { id: req.params.id } });
    if (!dom) return res.status(404).json({ message: "Domain not found" });

    // Unset all other primaries for this tenant
    await prisma.tenantDomain.updateMany({
      where: { tenantId: dom.tenantId },
      data: { isPrimary: false },
    });

    const updated = await prisma.tenantDomain.update({
      where: { id: req.params.id },
      data: { isPrimary: true },
      include: { tenant: { select: { id: true, name: true, slug: true, subscriptionPlan: true } } },
    });

    await logDomainAudit(req, "set_primary", updated);
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Delete domain ──
router.delete("/:id", async (req, res) => {
  try {
    const dom = await prisma.tenantDomain.findUnique({ where: { id: req.params.id } });
    if (!dom) return res.status(404).json({ message: "Domain not found" });

    await prisma.tenantDomain.delete({ where: { id: req.params.id } });

    await logDomainAudit(req, "delete", dom);
    res.json({ message: "Domain removed" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
