const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

// Helper function to read Docker secrets
function readSecret(secretName, fallbackEnvVar, defaultValue = "") {
  // Check if using Docker secrets
  if (process.env.USE_DOCKER_SECRETS === "true") {
    const secretPath = path.join("/run/secrets", secretName);
    try {
      if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, "utf8").trim();
      }
    } catch (err) {
      console.warn(`Warning: Could not read secret ${secretName}:`, err.message);
    }
  }
  // Fallback to environment variable
  return process.env[fallbackEnvVar] || defaultValue;
}

// Read all secrets (including DB user and name for full security)
const postgresDb = readSecret("uniconn_postgres_db", "POSTGRES_DB", "uniconn");
const postgresUser = readSecret("uniconn_postgres_user", "POSTGRES_USER", "uniconn");
const postgresPassword = readSecret("uniconn_postgres_password", "POSTGRES_PASSWORD", "");
const jwtSecret = readSecret("uniconn_jwt_secret", "JWT_SECRET", "dev-secret-change-me");
const sendgridApiKey = readSecret("uniconn_sendgrid_api_key", "SENDGRID_API_KEY", "");
const sendgridFromEmail = readSecret("uniconn_sendgrid_from_email", "SENDGRID_FROM_EMAIL", "noreply@uniconn.ca");

// Build database URL
function buildDatabaseUrl() {
  // If DATABASE_URL is provided directly, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Build from components (secrets or env vars)
  const host = process.env.POSTGRES_HOST || "db";
  const port = process.env.POSTGRES_PORT || "5432";
  
  return `postgres://${postgresUser}:${postgresPassword}@${host}:${port}/${postgresDb}`;
}

module.exports = {
  port: process.env.PORT || 8080,
  db: {
    connectionString: buildDatabaseUrl()
  },
  jwtSecret: jwtSecret,
  jwtExpiresIn: "7d",
  nodeEnv: process.env.NODE_ENV || "development",
  sendgrid: {
    apiKey: sendgridApiKey,
    fromEmail: sendgridFromEmail
  }
};
