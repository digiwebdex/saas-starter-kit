const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { authenticate, prisma } = require("../middleware/auth");

const upload = multer({ dest: process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads") });
router.use(authenticate);

router.get("/", async (req, res) => {
  try { res.json(await prisma.booking.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: "desc" } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get("/:id", async (req, res) => {
  try {
    const b = await prisma.booking.findFirst({ where: { id: req.params.id, tenantId: req.tenantId }, include: { segments: true, travelers: true, checklist: true } });
    if (!b) return res.status(404).json({ message: "Not found" });
    res.json(b);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/", async (req, res) => {
  try { res.status(201).json(await prisma.booking.create({ data: { ...req.body, tenantId: req.tenantId } })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id", async (req, res) => {
  try {
    await prisma.booking.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: req.body });
    res.json(await prisma.booking.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id", async (req, res) => {
  try { await prisma.booking.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id/status", async (req, res) => {
  try {
    const old = await prisma.booking.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    await prisma.booking.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: req.body.status } });
    await prisma.bookingTimelineEvent.create({ data: { bookingId: req.params.id, type: "status_change", content: `Status: ${old.status} → ${req.body.status}`, oldStatus: old.status, newStatus: req.body.status, createdBy: req.userId } });
    res.json(await prisma.booking.findFirst({ where: { id: req.params.id } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Segments
router.get("/:id/segments", async (req, res) => {
  try { res.json(await prisma.bookingSegment.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/segments", async (req, res) => {
  try { res.status(201).json(await prisma.bookingSegment.create({ data: { ...req.body, bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/segments/:segId", async (req, res) => {
  try { await prisma.bookingSegment.delete({ where: { id: req.params.segId } }); res.json({ success: true }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Travelers
router.get("/:id/travelers", async (req, res) => {
  try { res.json(await prisma.bookingTraveler.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/travelers", async (req, res) => {
  try { res.status(201).json(await prisma.bookingTraveler.create({ data: { ...req.body, bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/travelers/:tId", async (req, res) => {
  try { await prisma.bookingTraveler.delete({ where: { id: req.params.tId } }); res.json({ success: true }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Checklist
router.get("/:id/checklist", async (req, res) => {
  try { res.json(await prisma.bookingChecklistItem.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/checklist", async (req, res) => {
  try { res.status(201).json(await prisma.bookingChecklistItem.create({ data: { ...req.body, bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.patch("/:id/checklist/:itemId", async (req, res) => {
  try {
    const data = { done: req.body.done };
    if (req.body.done) { data.doneAt = new Date(); data.doneBy = req.userId; }
    await prisma.bookingChecklistItem.update({ where: { id: req.params.itemId }, data });
    res.json(await prisma.bookingChecklistItem.findUnique({ where: { id: req.params.itemId } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Timeline
router.get("/:id/timeline", async (req, res) => {
  try { res.json(await prisma.bookingTimelineEvent.findMany({ where: { bookingId: req.params.id }, orderBy: { createdAt: "desc" } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/timeline", async (req, res) => {
  try { res.status(201).json(await prisma.bookingTimelineEvent.create({ data: { ...req.body, bookingId: req.params.id, createdBy: req.userId } })); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Documents
router.get("/:id/documents", async (req, res) => {
  try { res.json(await prisma.bookingDocument.findMany({ where: { bookingId: req.params.id } })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post("/:id/documents", upload.single("file"), async (req, res) => {
  try {
    const doc = await prisma.bookingDocument.create({ data: { bookingId: req.params.id, name: req.file.originalname, type: req.file.mimetype, url: `/uploads/${req.file.filename}`, uploadedBy: req.userId } });
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete("/:id/documents/:docId", async (req, res) => {
  try { await prisma.bookingDocument.delete({ where: { id: req.params.docId } }); res.json({ success: true }); } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
