require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(s => s.trim())
  : ["*"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tenants", require("./routes/tenants"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/clients", require("./routes/clients"));
app.use("/api/agents", require("./routes/crud")("agent"));
app.use("/api/vendors", require("./routes/vendors"));
app.use("/api/leads", require("./routes/leads"));
app.use("/api/tasks", require("./routes/crud")("task"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/payments", require("./routes/crud")("payment"));
app.use("/api/quotations", require("./routes/quotations"));
app.use("/api/accounts", require("./routes/accounts"));
app.use("/api/transactions", require("./routes/crud")("transaction"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/hajj", require("./routes/hajj"));
app.use("/api/subscriptions", require("./routes/crud")("subscription"));
app.use("/api/payment-requests", require("./routes/crud")("paymentRequest"));

// Admin routes
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`✅ Skyline API running on port ${PORT}`));
