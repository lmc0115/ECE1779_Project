const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { broadcastCommentCreated } = require("../services/websocket");

const router = express.Router({ mergeParams: true });

// GET /api/events/:eventId/comments
router.get("/:eventId/comments", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const result = await db.query(
      `SELECT c.id, c.body, c.created_at, u.name AS author_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.event_id=$1
       ORDER BY c.created_at ASC`,
      [eventId]
    );
    res.json({ comments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:eventId/comments
router.post("/:eventId/comments", authRequired, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const { body } = req.body;
    const result = await db.query(
      `INSERT INTO comments (event_id,user_id,body)
       VALUES ($1,$2,$3)
       RETURNING id,event_id,user_id,body,created_at`,
      [eventId, req.user.id, body]
    );

    // Get comment with author name for broadcast
    const commentWithAuthor = await db.query(
      `SELECT c.id, c.body, c.created_at, u.name AS author_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id=$1`,
      [result.rows[0].id]
    );

    // broadcast real-time update
    broadcastCommentCreated(commentWithAuthor.rows[0], eventId);

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
