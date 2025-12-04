const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const notificationService = require("../services/notificationService");
const { broadcastRSVPUpdate } = require("../services/websocket");

const router = express.Router({ mergeParams: true });

// GET /api/events/:eventId/rsvps
router.get("/:eventId/rsvps", authRequired, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);

    const result = await db.query(
      `SELECT r.id, r.status, r.created_at, r.updated_at,
              u.name AS attendee_name, u.id AS attendee_id
       FROM rsvps r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id=$1`,
      [eventId]
    );

    res.json({ rsvps: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:eventId/rsvps
router.post("/:eventId/rsvps", authRequired, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const { status } = req.body; // going | interested | cancelled

    // Insert or update RSVP
    const result = await db.query(
      `INSERT INTO rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
       RETURNING id, event_id, user_id, status, created_at, updated_at`,
      [eventId, req.user.id, status]
    );

    const saved = result.rows[0];

    // ============= NOTIFICATION (SendGrid) =================
    notificationService.notifyRSVPConfirmation({
      event_id: saved.event_id,
      user_id: saved.user_id,
      status: saved.status
    }).catch(console.error);

    // ============= REALTIME BROADCAST ======================
    // Include user info for frontend UI
    const payload = {
      ...saved,
      user: { id: req.user.id, name: req.user.name }
    };

    broadcastRSVPUpdate(payload, eventId);

    res.status(201).json({ rsvp: payload });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
