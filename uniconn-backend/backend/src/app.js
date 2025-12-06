const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const commentsRoutes = require("./routes/comments");
const rsvpsRoutes = require("./routes/rsvps");
const healthRoutes = require("./routes/health");
const { metricsMiddleware } = require("./routes/health");
const analyticsRoutes = require("./routes/analytics");

const app = express();

// Security headers - configured for HTTP (no HTTPS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdn.socket.io", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null, // IMPORTANT: Disable auto-upgrade to HTTPS
    },
  },
  hsts: false, // IMPORTANT: Disable HSTS (HTTP Strict Transport Security) for HTTP-only deployments
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
}));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(metricsMiddleware); // Track HTTP request duration for Prometheus

// API Routes
app.use("/api/auth", authRoutes);
// Mount nested routes first (more specific routes before general ones)
app.use("/api/events", commentsRoutes); // nested: /events/:eventId/comments
app.use("/api/events", rsvpsRoutes);    // nested: /events/:eventId/rsvps
app.use("/api/events", eventRoutes);    // general: /events/:id (must be last)
app.use("/api/analytics", analyticsRoutes);
app.use("/api", healthRoutes);

// Serve static frontend files
const frontendPath = path.join(__dirname, "..", "frontendtest");
app.use(express.static(frontendPath));

// Serve index.html for root and any non-API routes (SPA support)
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Fallback: serve index.html for any unmatched routes (except /api)
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

module.exports = app;
