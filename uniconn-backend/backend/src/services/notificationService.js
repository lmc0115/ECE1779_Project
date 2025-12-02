const sgMail = require("@sendgrid/mail");
const config = require("../config");
const db = require("../db");

// Initialize SendGrid
if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

// Helper: Get user email by user_id
async function getUserEmail(userId) {
  try {
    const result = await db.query("SELECT email, name FROM users WHERE id=$1", [userId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("[notification] Error fetching user email:", err);
    return null;
  }
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
  console.log(`[notification] Event created: ${event.title} (#${event.id})`);
  
  // Get full event details with organizer info
  const eventDetails = await getEventDetails(event.id);
  if (!eventDetails) return;

  // Format event date/time
  const startTime = new Date(eventDetails.start_time).toLocaleString();
  const endTime = eventDetails.end_time 
    ? new Date(eventDetails.end_time).toLocaleString() 
    : "TBD";

  const htmlContent = `
    <h2>New Event: ${eventDetails.title}</h2>
    <p><strong>Organizer:</strong> ${eventDetails.organizer_name}</p>
    <p><strong>Description:</strong> ${eventDetails.description || "N/A"}</p>
    <p><strong>Location:</strong> ${eventDetails.location || "TBD"}</p>
    <p><strong>Start Time:</strong> ${startTime}</p>
    <p><strong>End Time:</strong> ${endTime}</p>
    <p><strong>Faculty:</strong> ${eventDetails.faculty || "N/A"}</p>
    <p><strong>Category:</strong> ${eventDetails.category || "N/A"}</p>
  `;

  // Note: In a real system, you might want to notify all users or subscribed users
  // For now, we just log it. You can extend this to send to a mailing list.
  console.log(`[notification] Event created notification prepared for: ${eventDetails.title}`);
}

async function notifyEventUpdated(event) {
  console.log(`[notification] Event updated: ${event.title} (#${event.id})`);
  
  // Get full event details
  const eventDetails = await getEventDetails(event.id);
  if (!eventDetails) return;

  // Format event date/time
  const startTime = new Date(eventDetails.start_time).toLocaleString();
  const endTime = eventDetails.end_time 
    ? new Date(eventDetails.end_time).toLocaleString() 
    : "TBD";

  const htmlContent = `
    <h2>Event Updated: ${eventDetails.title}</h2>
    <p>The event details have been updated.</p>
    <p><strong>Organizer:</strong> ${eventDetails.organizer_name}</p>
    <p><strong>Description:</strong> ${eventDetails.description || "N/A"}</p>
    <p><strong>Location:</strong> ${eventDetails.location || "TBD"}</p>
    <p><strong>Start Time:</strong> ${startTime}</p>
    <p><strong>End Time:</strong> ${endTime}</p>
    <p><strong>Faculty:</strong> ${eventDetails.faculty || "N/A"}</p>
    <p><strong>Category:</strong> ${eventDetails.category || "N/A"}</p>
  `;

  // Note: In a real system, notify all RSVP'd users
  // For now, we just log it.
  console.log(`[notification] Event updated notification prepared for: ${eventDetails.title}`);
}

async function notifyRSVPConfirmation(rsvpData) {
  // rsvpData should contain: { event_id, user_id, status }
  const { event_id, user_id, status } = rsvpData;

  try {
    // Get user email
    const user = await getUserEmail(user_id);
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

    // Format event date/time
    const startTime = new Date(event.start_time).toLocaleString();
    const endTime = event.end_time 
      ? new Date(event.end_time).toLocaleString() 
      : "TBD";

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
