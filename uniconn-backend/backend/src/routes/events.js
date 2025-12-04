const express = require("express");
const db = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");
const notificationService = require("../services/notificationService");
const {
  broadcastEventCreated,
  broadcastEventUpdated,
  broadcastEventDeleted
} = require("../services/websocket");

const router = express.Router();

// Helper: build WHERE clause for filters
function buildFilterQuery({ faculty, category, from, to, q }) {
  const where = [];
  const params = [];
  let idx = 1;

  if (faculty) {
    where.push(`faculty = $${idx++}`);
    params.push(faculty);
  }
  if (category) {
    where.push(`category = $${idx++}`);
    params.push(category);
  }
  if (from) {
    where.push(`start_time >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    where.push(`start_time <= $${idx++}`);
    params.push(to);
  }
  if (q) {
    where.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereClause, params };
}

// GET /api/events
router.get("/", async (req, res) => {
  try {
    const { faculty, category, from, to, q } = req.query;
    const { whereClause, params } = buildFilterQuery({ faculty, category, from, to, q });

    const result = await db.query(
      `SELECT e.*, u.name AS organizer_name
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       ${whereClause}
       ORDER BY start_time ASC`,
      params
    );

    res.json({ events: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await db.query(
      `SELECT e.*, u.name AS organizer_name
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.id=$1`,
      [id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ event: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events (organizer/admin)
router.post("/", authRequired, requireRole("organizer", "admin"), async (req, res) => {
  try {
    const {
      title, description, location,
      faculty, category, start_time, end_time
    } = req.body;

    const result = await db.query(
      `INSERT INTO events
       (organizer_id,title,description,location,faculty,category,start_time,end_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [req.user.id, title, description, location, faculty, category, start_time, end_time]
    );

    const event = result.rows[0];

    // fire-and-forget notification
    notificationService.notifyEventCreated(event).catch(console.error);

    // websocket broadcast
    broadcastEventCreated(event);

    res.status(201).json({ event });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/events/:id
router.put("/:id", authRequired, requireRole("organizer", "admin"), async (req, res) => {
  const id = Number(req.params.id);

  try {
    if (req.user.role === "organizer") {
      const ownerCheck = await db.query(
        "SELECT 1 FROM events WHERE id=$1 AND organizer_id=$2",
        [id, req.user.id]
      );
      if (!ownerCheck.rows[0]) {
        return res.status(403).json({ error: "You can only edit your own events" });
      }
    }

    const {
      title, description, location,
      faculty, category, start_time, end_time
    } = req.body;

    const result = await db.query(
      `UPDATE events
       SET title=$1,
           description=$2,
           location=$3,
           faculty=$4,
           category=$5,
           start_time=$6,
           end_time=$7,
           updated_at=NOW()
       WHERE id=$8
       RETURNING *`,
      [title, description, location, faculty, category, start_time, end_time, id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });

    const event = result.rows[0];

    notificationService.notifyEventUpdated(event).catch(console.error);

    broadcastEventUpdated(event);

    res.json({ event });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/events/:id
router.delete("/:id", authRequired, requireRole("organizer", "admin"), async (req, res) => {
  const id = Number(req.params.id);

  try {
    if (req.user.role === "organizer") {
      const ownerCheck = await db.query(
        "SELECT 1 FROM events WHERE id=$1 AND organizer_id=$2",
        [id, req.user.id]
      );
      if (!ownerCheck.rows[0]) {
        return res.status(403).json({ error: "You can only delete your own events" });
      }
    }

    await db.query("DELETE FROM events WHERE id=$1", [id]);

    broadcastEventDeleted(id);

    res.status(204).send();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
