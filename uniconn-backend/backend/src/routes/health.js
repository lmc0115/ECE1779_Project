const express = require("express");
const client = require("prom-client");
const db = require("../db");

const router = express.Router();

// Prometheus metrics registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

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
