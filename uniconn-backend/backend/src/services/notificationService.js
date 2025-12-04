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

// Helper: Format date safely
function formatDate(dateString) {
  if (!dateString) return "TBD";
  try {
    return new Date(dateString).toLocaleString();
  } catch (err) {
    return dateString;
  }
}

// Helper: Send email via SendGrid
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
  // Early exit if SendGrid is not configured
  if (!config.sendgrid.apiKey) {
    console.log(`[notification] Event created: ${event.title} (#${event.id}) - SendGrid not configured`);
    return;
  }

  try {
    const e = await getEventDetails(event.id);
    if (!e || !e.organizer_email) {
      console.error(`[notification] Cannot send event creation email: event ${event.id} or organizer email not found`);
      return;
    }

    // Format event date/time safely
    const startTime = formatDate(e.start_time);
    const endTime = formatDate(e.end_time);

    const subject = `Event Created: ${e.title}`;

    const html = `
      <h2>Your event has been created</h2>
      <p>Hi ${e.organizer_name}, your event is now live!</p>
      <h3>${e.title}</h3>
      <p><strong>Description:</strong> ${e.description || "N/A"}</p>
      <p><strong>Location:</strong> ${e.location || "TBD"}</p>
      <p><strong>Start:</strong> ${startTime}</p>
      <p><strong>End:</strong> ${endTime}</p>
    `;

    await sendEmail(e.organizer_email, subject, html);
  } catch (err) {
    console.error("[notification] Error in notifyEventCreated:", err);
  }
}

/* ============================================================
   EMAIL — Organizer Confirmation (Event Updated)
   ============================================================ */
async function notifyEventUpdated(event) {
  // Early exit if SendGrid is not configured
  if (!config.sendgrid.apiKey) {
    console.log(`[notification] Event updated: ${event.title} (#${event.id}) - SendGrid not configured`);
    return;
  }

  try {
    const e = await getEventDetails(event.id);
    if (!e || !e.organizer_email) {
      console.error(`[notification] Cannot send event update email: event ${event.id} or organizer email not found`);
      return;
    }

    // Format event date/time safely
    const startTime = formatDate(e.start_time);
    const endTime = formatDate(e.end_time);

    const subject = `Event Updated: ${e.title}`;

    const html = `
      <h2>Your event has been updated</h2>
      <p>Hi ${e.organizer_name}, here are the new details:</p>
      <h3>${e.title}</h3>
      <p><strong>Description:</strong> ${e.description || "N/A"}</p>
      <p><strong>Location:</strong> ${e.location || "TBD"}</p>
      <p><strong>Start:</strong> ${startTime}</p>
      <p><strong>End:</strong> ${endTime}</p>
    `;

    await sendEmail(e.organizer_email, subject, html);
  } catch (err) {
    console.error("[notification] Error in notifyEventUpdated:", err);
  }
}

/* ============================================================
   EMAIL — RSVP Confirmation to Student
   ============================================================ */
async function notifyRSVPConfirmation({ event_id, user_id, status }) {
  // Early exit if SendGrid is not configured
  if (!config.sendgrid.apiKey) {
    console.log(`[notification] RSVP confirmation skipped - SendGrid not configured`);
    return;
  }

  try {
    const user = await getUserEmail(user_id);
    const event = await getEventDetails(event_id);

    if (!user || !event) {
      console.error(`[notification] Cannot send RSVP confirmation: user ${user_id} or event ${event_id} not found`);
      return;
    }

    // Format event date/time safely
    const startTime = formatDate(event.start_time);
    const endTime = formatDate(event.end_time);

    const subject = `RSVP ${status}: ${event.title}`;

    const html = `
      <h2>RSVP Confirmation</h2>
      <p>Hi ${user.name}, your RSVP status is: <strong>${status}</strong></p>
      <h3>${event.title}</h3>
      <p><strong>Location:</strong> ${event.location || "TBD"}</p>
      <p><strong>Start:</strong> ${startTime}</p>
      <p><strong>End:</strong> ${endTime}</p>
      <p>Organizer: ${event.organizer_name}</p>
    `;

    await sendEmail(user.email, subject, html);
  } catch (err) {
    console.error("[notification] Error in notifyRSVPConfirmation:", err);
  }
}

/* ============================================================
   EMAIL — Welcome Email After Registration
   ============================================================ */
async function notifyUserRegistered(user) {
  if (!user || !user.email) return;

  // Early exit if SendGrid is not configured
  if (!config.sendgrid.apiKey) {
    console.log(`[notification] User registration notification skipped - SendGrid not configured`);
    return;
  }

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
