const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const commentsRoutes = require("./routes/comments");
const rsvpsRoutes = require("./routes/rsvps");
const healthRoutes = require("./routes/health");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
// Mount nested routes first (more specific routes before general ones)
app.use("/api/events", commentsRoutes); // nested: /events/:eventId/comments
app.use("/api/events", rsvpsRoutes);    // nested: /events/:eventId/rsvps
app.use("/api/events", eventRoutes);    // general: /events/:id (must be last)
app.use("/api", healthRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
