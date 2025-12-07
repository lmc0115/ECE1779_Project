const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { broadcastCommentCreated, broadcastCommentDeleted } = require("../services/websocket");

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
    const savedComment = commentWithAuthor.rows[0];

    broadcastCommentCreated(savedComment, eventId);

    res.status(201).json({ comment: savedComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/events/:eventId/comments/:commentId
router.delete("/:eventId/comments/:commentId", authRequired, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const commentId = Number(req.params.commentId);

    // Check if comment exists and belongs to the user (or user is organizer of the event)
    const comment = await db.query(
      `SELECT c.*, e.organizer_id 
       FROM comments c 
       JOIN events e ON c.event_id = e.id 
       WHERE c.id = $1 AND c.event_id = $2`,
      [commentId, eventId]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Only allow deletion if user is the comment author or the event organizer
    const isAuthor = comment.rows[0].user_id === req.user.id;
    const isOrganizer = comment.rows[0].organizer_id === req.user.id;

    if (!isAuthor && !isOrganizer) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await db.query("DELETE FROM comments WHERE id = $1", [commentId]);

    // Broadcast real-time deletion
    broadcastCommentDeleted(commentId, eventId);

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
