const sgMail = require("@sendgrid/mail");
const config = require("../config");
const db = require("../db");

// Initialize SendGrid
if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

// Helper: Fetch user email + name
async function getUserEmail(userId) {
  try {
    const result = await db.query(
      "SELECT email, name FROM users WHERE id=$1",
      [userId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("[notification] Error fetching user email:", err);
    return null;
  }
}

// Helper: Fetch event with organizer info
async function getEventDetails(eventId) {
  try {
    const result = await db.query(
      `SELECT e.*, u.name AS organizer_name, u.email AS organizer_email
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.id=$1`,
      [eventId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("[notification] Error fetching event details:", err);
    return null;
  }
}

// Send email wrapper
async function sendEmail(to, subject, htmlContent) {
  if (!config.sendgrid.apiKey) {
    return console.log(
      `[notification] (SIMULATED) Would send to ${to}: ${subject}`
    );
  }

  try {
    await sgMail.send({
      to,
      from: config.sendgrid.fromEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[notification] Email sent to: ${to}`);
  } catch (err) {
    console.error(`[notification] Failed to send email to ${to}:`, err);
    if (err.response?.body) {
      console.error("[sendgrid error]", err.response.body);
    }
  }
}

/* ============================================================
   EMAIL — Organizer Confirmation (Event Created)
   ============================================================ */
async function notifyEventCreated(event) {
  const e = await getEventDetails(event.id);
  if (!e) return;

  const subject = `Event Created: ${e.title}`;

  const html = `
    <h2>Your event has been created</h2>
    <p>Hi ${e.organizer_name}, your event is now live!</p>
    <h3>${e.title}</h3>
    <p><strong>Description:</strong> ${e.description}</p>
    <p><strong>Location:</strong> ${e.location}</p>
    <p><strong>Start:</strong> ${new Date(e.start_time).toLocaleString()}</p>
    <p><strong>End:</strong> ${new Date(e.end_time).toLocaleString()}</p>
  `;

  await sendEmail(e.organizer_email, subject, html);
}

/* ============================================================
   EMAIL — Organizer Confirmation (Event Updated)
   ============================================================ */
async function notifyEventUpdated(event) {
  const e = await getEventDetails(event.id);
  if (!e) return;

  const subject = `Event Updated: ${e.title}`;

  const html = `
    <h2>Your event has been updated</h2>
    <p>Hi ${e.organizer_name}, here are the new details:</p>
    <h3>${e.title}</h3>
    <p><strong>Description:</strong> ${e.description}</p>
    <p><strong>Location:</strong> ${e.location}</p>
    <p><strong>Start:</strong> ${new Date(e.start_time).toLocaleString()}</p>
    <p><strong>End:</strong> ${new Date(e.end_time).toLocaleString()}</p>
  `;

  await sendEmail(e.organizer_email, subject, html);
}

/* ============================================================
   EMAIL — RSVP Confirmation to Student
   ============================================================ */
async function notifyRSVPConfirmation({ event_id, user_id, status }) {
  const user = await getUserEmail(user_id);
  const event = await getEventDetails(event_id);

  if (!user || !event) return;

  const subject = `RSVP ${status}: ${event.title}`;

  const html = `
    <h2>RSVP Confirmation</h2>
    <p>Hi ${user.name}, your RSVP status is: <strong>${status}</strong></p>
    <h3>${event.title}</h3>
    <p><strong>Location:</strong> ${event.location}</p>
    <p><strong>Start:</strong> ${new Date(event.start_time).toLocaleString()}</p>
    <p><strong>End:</strong> ${new Date(event.end_time).toLocaleString()}</p>
    <p>Organizer: ${event.organizer_name}</p>
  `;

  await sendEmail(user.email, subject, html);
}

/* ============================================================
   EMAIL — Welcome Email After Registration
   ============================================================ */
async function notifyUserRegistered(user) {
  if (!user || !user.email) return;

  const subject = `Welcome to UniConn!`;

  const html = `
    <h2>Welcome, ${user.name || "New User"}!</h2>
    <p>Your account has been successfully created.</p>

    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> ${user.role}</p>

    <p>You can now log in and start exploring events.</p>
    <br>
    <p>Thank you for joining UniConn.</p>
  `;

  await sendEmail(user.email, subject, html);
}


module.exports = {
  notifyEventCreated,
  notifyEventUpdated,
  notifyRSVPConfirmation,
  notifyUserRegistered,
};
