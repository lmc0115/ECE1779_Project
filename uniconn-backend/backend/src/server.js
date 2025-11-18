const app = require("./app");
const config = require("./config");

app.listen(config.port, () => {
  console.log(`UniConn API listening on port ${config.port}`);
});
