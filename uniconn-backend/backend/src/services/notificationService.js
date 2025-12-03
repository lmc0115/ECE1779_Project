const sgMail = require("@sendgrid/mail");
const config = require("../config");
const db = require("../db");

// Initialize SendGrid
if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

// Helper: Get event details with organizer info
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
    console.log(`[notification] SendGrid not configured. Would send to ${to}: ${subject}`);
    return;
  }

  try {
    const msg = {
      to,
      from: config.sendgrid.fromEmail,
      subject,
      html: htmlContent
    };
    await sgMail.send(msg);
    console.log(`[notification] Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[notification] Error sending email to ${to}:`, err);
    if (err.response) {
      console.error("[notification] SendGrid error details:", err.response.body);
    }
  }
}

async function notifyEventCreated(event) {
  // Early exit if SendGrid is not configured
  if (!config.sendgrid.apiKey) {
    console.log(`[notification] Event created: ${event.title} (#${event.id}) - SendGrid not configured`);
    return;
  }

  try {
    // Get full event details with organizer info
    const eventDetails = await getEventDetails(event.id);
    if (!eventDetails || !eventDetails.organizer_email) {
      console.error(`[notification] Cannot send event creation email: event ${event.id} or organizer email not found`);
      return;
    }

    // Format event date/time safely
    const startTime = formatDate(eventDetails.start_time);
    const endTime = formatDate(eventDetails.end_time);

    const htmlContent = `
      <h2>Event Created Successfully: ${eventDetails.title}</h2>
      <p>Your event has been created and is now visible to users.</p>
      <h3>Event Details:</h3>
      <p><strong>Title:</strong> ${eventDetails.title}</p>
      <p><strong>Description:</strong> ${eventDetails.description || "N/A"}</p>
      <p><strong>Location:</strong> ${eventDetails.location || "TBD"}</p>
      <p><strong>Start Time:</strong> ${startTime}</p>
      <p><strong>End Time:</strong> ${endTime}</p>
      <p><strong>Faculty:</strong> ${eventDetails.faculty || "N/A"}</p>
      <p><strong>Category:</strong> ${eventDetails.category || "N/A"}</p>
      <p>Thank you for using UniConn!</p>
    `;

    await sendEmail(
      eventDetails.organizer_email,
      `Event Created: ${eventDetails.title}`,
      htmlContent
    );
  } catch (err) {
    console.error("[notification] Error in notifyEventCreated:", err);
  }
}

async function notifyEventUpdated(event) {
  // Early exit if SendGrid is not configured
  if (!config.sendgrid.apiKey) {
    console.log(`[notification] Event updated: ${event.title} (#${event.id}) - SendGrid not configured`);
    return;
  }

  try {
    // Get full event details with organizer info
    const eventDetails = await getEventDetails(event.id);
    if (!eventDetails || !eventDetails.organizer_email) {
      console.error(`[notification] Cannot send event update email: event ${event.id} or organizer email not found`);
      return;
    }

    // Format event date/time safely
    const startTime = formatDate(eventDetails.start_time);
    const endTime = formatDate(eventDetails.end_time);

    const htmlContent = `
      <h2>Event Updated: ${eventDetails.title}</h2>
      <p>Your event details have been updated.</p>
      <h3>Updated Event Details:</h3>
      <p><strong>Title:</strong> ${eventDetails.title}</p>
      <p><strong>Description:</strong> ${eventDetails.description || "N/A"}</p>
      <p><strong>Location:</strong> ${eventDetails.location || "TBD"}</p>
      <p><strong>Start Time:</strong> ${startTime}</p>
      <p><strong>End Time:</strong> ${endTime}</p>
      <p><strong>Faculty:</strong> ${eventDetails.faculty || "N/A"}</p>
      <p><strong>Category:</strong> ${eventDetails.category || "N/A"}</p>
      <p>Thank you for using UniConn!</p>
    `;

    await sendEmail(
      eventDetails.organizer_email,
      `Event Updated: ${eventDetails.title}`,
      htmlContent
    );
  } catch (err) {
    console.error("[notification] Error in notifyEventUpdated:", err);
  }
}

async function notifyRSVPConfirmation(rsvpData) {
  // rsvpData should contain: { event_id, user_id, status }
  const { event_id, user_id, status } = rsvpData;

  // Early exit if SendGrid is not configured
  if (!config.sendgrid.apiKey) {
    console.log(`[notification] RSVP confirmation skipped - SendGrid not configured`);
    return;
  }

  try {
    // Get user email
    const userResult = await db.query("SELECT email, name FROM users WHERE id=$1", [user_id]);
    const user = userResult.rows[0];
    if (!user || !user.email) {
      console.error(`[notification] Cannot send RSVP confirmation: user ${user_id} not found`);
      return;
    }

    // Get event details
    const event = await getEventDetails(event_id);
    if (!event) {
      console.error(`[notification] Cannot send RSVP confirmation: event ${event_id} not found`);
      return;
    }

    // Format event date/time safely
    const startTime = formatDate(event.start_time);
    const endTime = formatDate(event.end_time);

    // Determine status message
    let statusMessage = "";
    let subject = "";
    if (status === "going") {
      statusMessage = "You have confirmed your attendance";
      subject = `RSVP Confirmed: ${event.title}`;
    } else if (status === "interested") {
      statusMessage = "You have marked your interest";
      subject = `RSVP Interest: ${event.title}`;
    } else if (status === "cancelled") {
      statusMessage = "Your RSVP has been cancelled";
      subject = `RSVP Cancelled: ${event.title}`;
    } else {
      statusMessage = `Your RSVP status: ${status}`;
      subject = `RSVP Update: ${event.title}`;
    }

    const htmlContent = `
      <h2>${subject}</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>${statusMessage} for the following event:</p>
      <h3>${event.title}</h3>
      <p><strong>Organizer:</strong> ${event.organizer_name}</p>
      <p><strong>Description:</strong> ${event.description || "N/A"}</p>
      <p><strong>Location:</strong> ${event.location || "TBD"}</p>
      <p><strong>Start Time:</strong> ${startTime}</p>
      <p><strong>End Time:</strong> ${endTime}</p>
      <p><strong>Faculty:</strong> ${event.faculty || "N/A"}</p>
      <p><strong>Category:</strong> ${event.category || "N/A"}</p>
      <p>Thank you for using UniConn!</p>
    `;

    await sendEmail(user.email, subject, htmlContent);
  } catch (err) {
    console.error("[notification] Error in notifyRSVPConfirmation:", err);
  }
}

module.exports = {
  notifyEventCreated,
  notifyEventUpdated,
  notifyRSVPConfirmation
};
