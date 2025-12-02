const app = require("./app");
const config = require("./config");
const { initializeWebSocket } = require("./services/websocket");

const server = app.listen(config.port, () => {
  console.log(`UniConn API listening on port ${config.port}`);
});

// Initialize WebSocket server
initializeWebSocket(server);
