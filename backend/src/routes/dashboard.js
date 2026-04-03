const router = require("express").Router();
const { authenticate, prisma } = require("../middleware/auth");

router.use(authenticate);

router.get("/stats", async (req, res) => {
  try {
    const tid = req.tenantId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = now.toISOString().slice(0, 10);
    const week = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    const [clients, bookings, invoices, leads, payments, vendors] = await Promise.all([
      prisma.client.count({ where: { tenantId: tid } }),
      prisma.booking.findMany({ where: { tenantId: tid } }),
      prisma.invoice.findMany({ where: { tenantId: tid } }),
      prisma.lead.findMany({ where: { tenantId: tid } }),
      prisma.payment.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.vendorBill.findMany({ where: { tenantId: tid, status: { in: ["unpaid", "partial", "overdue"] } } }),
    ]);

    const users = await prisma.user.count({ where: { tenantId: tid } });
    const activeLeads = leads.filter(l => !["won", "lost"].includes(l.status)).length;
    const followUps = leads.filter(l => l.nextFollowUp && l.nextFollowUp <= today).length;
    const recentBookings = bookings.slice(0, 5);
    const confirmed = bookings.filter(b => b.status === "confirmed").length;
    const upcoming = bookings.filter(b => b.travelDateFrom && b.travelDateFrom >= today && b.travelDateFrom <= week).length;
    const overdue = invoices.filter(i => i.status === "overdue" || (i.dueDate && i.dueDate < today && i.dueAmount > 0));
    const salesMonth = payments.filter(p => p.createdAt >= new Date(monthStart)).reduce((s, p) => s + p.amount, 0);
    const vendorDues = vendors.reduce((s, v) => s + v.dueAmount, 0);

    // Top destinations
    const destMap = {};
    bookings.forEach(b => { if (b.destination) destMap[b.destination] = (destMap[b.destination] || 0) + 1; });
    const topDestinations = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([destination, count]) => ({ destination, count }));

    res.json({
      totalUsers: users,
      totalClients: clients,
      totalBookings: bookings.length,
      totalRevenue: invoices.reduce((s, i) => s + i.paidAmount, 0),
      recentBookings,
      recentPayments: payments,
      activeLeads,
      followUpsDueToday: followUps,
      quotationsSentThisMonth: 0,
      quotationsAwaitingApproval: 0,
      confirmedBookings: confirmed,
      upcomingDepartures: upcoming,
      overdueInvoices: overdue.length,
      overdueInvoiceAmount: overdue.reduce((s, i) => s + i.dueAmount, 0),
      vendorDues,
      salesThisMonth: salesMonth,
      topDestinations,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
