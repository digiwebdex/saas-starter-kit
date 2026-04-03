// Generic CRUD factory for simple resources
const { authenticate, prisma } = require("../middleware/auth");
const router = require("express").Router;

const MODEL_MAP = {
  agent: "agent",
  task: "task",
  payment: "payment",
  transaction: "transaction",
  subscription: "subscription",
  paymentRequest: "paymentRequest",
};

module.exports = function createCrudRouter(modelKey) {
  const r = router();
  const model = MODEL_MAP[modelKey] || modelKey;

  r.use(authenticate);

  r.get("/", async (req, res) => {
    try {
      const items = await prisma[model].findMany({
        where: { tenantId: req.tenantId },
        orderBy: { createdAt: "desc" },
      });
      res.json(items);
    } catch (err) { res.status(500).json({ message: err.message }); }
  });

  r.get("/:id", async (req, res) => {
    try {
      const item = await prisma[model].findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (err) { res.status(500).json({ message: err.message }); }
  });

  r.post("/", async (req, res) => {
    try {
      const item = await prisma[model].create({
        data: { ...req.body, tenantId: req.tenantId },
      });
      res.status(201).json(item);
    } catch (err) { res.status(500).json({ message: err.message }); }
  });

  r.patch("/:id", async (req, res) => {
    try {
      const item = await prisma[model].updateMany({
        where: { id: req.params.id, tenantId: req.tenantId },
        data: req.body,
      });
      const updated = await prisma[model].findFirst({ where: { id: req.params.id } });
      res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
  });

  r.delete("/:id", async (req, res) => {
    try {
      await prisma[model].deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
  });

  return r;
};
