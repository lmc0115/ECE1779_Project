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

// Configure Helmet with CSP that allows Socket.IO CDN
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.socket.io"],
      connectSrc: ["'self'", "ws:", "wss:"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events", commentsRoutes); // nested: /events/:eventId/comments
app.use("/api/events", rsvpsRoutes);    // nested: /events/:eventId/rsvps
app.use("/api", healthRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
