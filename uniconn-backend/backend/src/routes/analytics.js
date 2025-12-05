const express = require("express");
const router = express.Router();
const db = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

/**
 * GET /api/analytics/organizer/summary
 * Returns analytics summary for the logged-in organizer
 */
router.get("/organizer/summary", authRequired, requireRole("organizer"), async (req, res) => {
  try {
    const organizerId = req.user.id;

    // 1. Get total events count
    const totalEventsResult = await db.query(
      `SELECT COUNT(*) as count FROM events WHERE organizer_id = $1`,
      [organizerId]
    );
    const totalEvents = parseInt(totalEventsResult.rows[0].count);

    // 2. Get total RSVPs count (only 'going' status)
    const totalRsvpsResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM rsvps r
       JOIN events e ON r.event_id = e.id
       WHERE e.organizer_id = $1 AND r.status = 'going'`,
      [organizerId]
    );
    const totalRsvps = parseInt(totalRsvpsResult.rows[0].count);

    // 3. Calculate average RSVPs per event
    const avgRsvpsPerEvent = totalEvents > 0 ? (totalRsvps / totalEvents).toFixed(1) : 0;

    // 4. Get top 5 events by RSVP count
    const topEventsResult = await db.query(
      `SELECT 
         e.id,
         e.title,
         e.start_time,
         e.category,
         e.faculty,
         COUNT(r.id) FILTER (WHERE r.status = 'going') as rsvp_count,
         (SELECT COUNT(*) FROM comments WHERE event_id = e.id) as comment_count
       FROM events e
       LEFT JOIN rsvps r ON e.id = r.event_id
       WHERE e.organizer_id = $1
       GROUP BY e.id
       ORDER BY rsvp_count DESC
       LIMIT 5`,
      [organizerId]
    );

    // 5. Get all events with RSVP counts for chart
    const eventsChartResult = await db.query(
      `SELECT 
         e.id,
         e.title,
         COUNT(r.id) FILTER (WHERE r.status = 'going') as rsvp_count
       FROM events e
       LEFT JOIN rsvps r ON e.id = r.event_id
       WHERE e.organizer_id = $1
       GROUP BY e.id
       ORDER BY rsvp_count DESC
       LIMIT 10`,
      [organizerId]
    );

    // 6. Get faculty distribution of events (which faculties the organizer creates events for)
    const facultyDistributionResult = await db.query(
      `SELECT 
         faculty,
         COUNT(*) as count
       FROM events
       WHERE organizer_id = $1
       GROUP BY faculty
       ORDER BY count DESC`,
      [organizerId]
    );

    // 7. Get category distribution of events
    const categoryDistributionResult = await db.query(
      `SELECT 
         category,
         COUNT(*) as count
       FROM events
       WHERE organizer_id = $1
       GROUP BY category
       ORDER BY count DESC`,
      [organizerId]
    );

    res.json({
      success: true,
      data: {
        kpis: {
          totalEvents,
          totalRsvps,
          avgRsvpsPerEvent: parseFloat(avgRsvpsPerEvent)
        },
        topEvents: topEventsResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          startTime: row.start_time,
          category: row.category,
          faculty: row.faculty,
          rsvpCount: parseInt(row.rsvp_count),
          commentCount: parseInt(row.comment_count)
        })),
        eventsChart: eventsChartResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          rsvpCount: parseInt(row.rsvp_count)
        })),
        facultyDistribution: facultyDistributionResult.rows.map(row => ({
          faculty: row.faculty,
          count: parseInt(row.count)
        })),
        categoryDistribution: categoryDistributionResult.rows.map(row => ({
          category: row.category,
          count: parseInt(row.count)
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

module.exports = router;

