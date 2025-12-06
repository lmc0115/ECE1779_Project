const express = require("express");
const client = require("prom-client");
const db = require("../db");

const router = express.Router();

// Prometheus metrics registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom HTTP metrics
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestsInProgress = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method'],
  registers: [register]
});

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint to avoid recursion
  if (req.path === '/api/metrics') {
    return next();
  }

  const start = process.hrtime.bigint();
  httpRequestsInProgress.inc({ method: req.method });

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationInSeconds = Number(end - start) / 1e9;
    
    // Normalize route for better grouping
    let route = req.route?.path || req.path;
    // Replace IDs with :id placeholder
    route = route.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id');
    route = route.replace(/\/\d+/g, '/:id');
    
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode
    };

    httpRequestDurationSeconds.observe(labels, durationInSeconds);
    httpRequestsTotal.inc(labels);
    httpRequestsInProgress.dec({ method: req.method });
  });

  next();
};

router.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "db_error" });
  }
});

// /metrics for Prometheus scraping
router.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = router;
module.exports.metricsMiddleware = metricsMiddleware;
