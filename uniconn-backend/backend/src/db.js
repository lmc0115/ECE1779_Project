const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool({
  connectionString: config.db.connectionString,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

pool.on("error", (err) => {
  console.error("Unexpected PG client error", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
