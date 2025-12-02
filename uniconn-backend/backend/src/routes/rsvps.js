const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const notificationService = require("../services/notificationService");

const router = express.Router({ mergeParams: true });

// GET /api/events/:eventId/rsvps
router.get("/:eventId/rsvps", authRequired, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const result = await db.query(
      `SELECT r.id, r.status, r.created_at, u.name AS attendee_name
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

    const result = await db.query(
      `INSERT INTO rsvps (event_id,user_id,status)
       VALUES ($1,$2,$3)
       ON CONFLICT (event_id,user_id)
       DO UPDATE SET status = EXCLUDED.status, created_at = NOW()
       RETURNING id,event_id,user_id,status,created_at`,
      [eventId, req.user.id, status]
    );

    // fire-and-forget notification
    notificationService.notifyRSVPConfirmation({
      event_id: eventId,
      user_id: req.user.id,
      status: status
    }).catch(console.error);

    res.status(201).json({ rsvp: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
