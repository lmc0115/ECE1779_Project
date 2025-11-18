// Basic imports
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// Create Express app
const app = express();

// Middleware
app.use(cors());            // Allow frontend to call this API
app.use(express.json());    // Parse JSON request body

// PostgreSQL connection pool
// In Docker Compose, the host will be "db"
const pool = new Pool({
    host: process.env.PGHOST || "db",
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "uniconn"
});

// Simple helper function to test DB connection
async function testDbConnection() {
    try {
        const result = await pool.query("SELECT NOW() AS now");
        console.log("Database connected at:", result.rows[0].now);
    } catch (err) {
        console.error("Database connection error:", err);
    }
}

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT 1 AS ok");
        return res.status(200).json({ status: "ok", db: result.rows[0].ok });
    } catch (err) {
        console.error("Health check failed:", err);
        return res.status(500).json({ status: "error" });
    }
});

// Get all events
app.get("/events", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM events ORDER BY start_time ASC"
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching events:", err);
        return res.status(500).json({ error: "Failed to fetch events" });
    }
});

// Get a single event by id
app.get("/events/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event id" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM events WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching event by id:", err);
        return res.status(500).json({ error: "Failed to fetch event" });
    }
});

// Update an existing event
app.put("/events/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event id" });
    }

    const {
        title,
        description,
        faculty,
        event_type,
        start_time,
        end_time,
        location,
        organizer_id
    } = req.body || {};

    // Minimal required fields
    if (!title || !start_time || !organizer_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
      UPDATE events
      SET
        title = $1,
        description = $2,
        faculty = $3,
        event_type = $4,
        start_time = $5,
        end_time = $6,
        location = $7,
        organizer_id = $8
      WHERE id = $9
      RETURNING *;
    `;

    const values = [
        title,
        description || null,
        faculty || null,
        event_type || null,
        start_time,
        end_time || null,
        location || null,
        organizer_id,
        id
    ];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error updating event:", err);
        return res.status(500).json({ error: "Failed to update event" });
    }
});

// Delete an event
app.delete("/events/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event id" });
    }

    try {
        const result = await pool.query(
            "DELETE FROM events WHERE id = $1 RETURNING *;",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        return res.status(200).json({ message: "Event deleted" });
    } catch (err) {
        console.error("Error deleting event:", err);
        return res.status(500).json({ error: "Failed to delete event" });
    }
});

// Get registrations
app.get("/registrations", async (req, res) => {
    const userId = req.query.user_id;
    const eventId = req.query.event_id;

    let query = "SELECT * FROM registrations";
    const values = [];
    const conditions = [];

    if (userId) {
        conditions.push("user_id = $1");
        values.push(userId);
    }

    if (eventId) {
        const index = values.length + 1;
        conditions.push("event_id = $" + index);
        values.push(eventId);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    try {
        const result = await pool.query(query, values);
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching registrations:", err);
        return res.status(500).json({ error: "Failed to fetch registrations" });
    }
});

// Create a new event
app.post("/events", async (req, res) => {
    const {
        title,
        description,
        faculty,
        event_type,
        start_time,
        end_time,
        location,
        organizer_id
    } = req.body || {};

    if (!title || !start_time || !organizer_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
    INSERT INTO events
      (title, description, faculty, event_type, start_time, end_time, location, organizer_id)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

    const values = [
        title,
        description || null,
        faculty || null,
        event_type || null,
        start_time,
        end_time || null,
        location || null,
        organizer_id
    ];

    try {
        const result = await pool.query(query, values);
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating event:", err);
        return res.status(500).json({ error: "Failed to create event" });
    }
});

// Create a new registration (RSVP)
app.post("/registrations", async (req, res) => {
    const { user_id, event_id, status } = req.body || {};

    // Basic validation
    if (!user_id || !event_id) {
        return res.status(400).json({ error: "Missing user_id or event_id" });
    }

    // Default status is "registered" if not provided
    const finalStatus = status || "registered";

    const query = `
    INSERT INTO registrations (user_id, event_id, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
    const values = [user_id, event_id, finalStatus];

    try {
        const result = await pool.query(query, values);
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating registration:", err);
        return res.status(500).json({ error: "Failed to create registration" });
    }
});

// Update registration status
app.put("/registrations/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid registration id" });
    }

    const { status } = req.body || {};

    if (!status || (status !== "registered" && status !== "cancelled")) {
        return res.status(400).json({ error: "Invalid status" });
    }

    try {
        const result = await pool.query(
            "UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *;",
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Registration not found" });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error updating registration:", err);
        return res.status(500).json({ error: "Failed to update registration" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`UniConn backend listening on port ${PORT}`);
    testDbConnection();
});