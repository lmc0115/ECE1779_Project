// This is a thin abstraction so you can later plug in
// DigitalOcean Functions, SendGrid, etc.

async function notifyEventCreated(event) {
  // TODO: call serverless endpoint or email service
  console.log(`[notification] Event created: ${event.title} (#${event.id})`);
}

async function notifyEventUpdated(event) {
  console.log(`[notification] Event updated: ${event.title} (#${event.id})`);
}

module.exports = {
  notifyEventCreated,
  notifyEventUpdated
};
