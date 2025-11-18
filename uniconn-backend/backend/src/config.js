const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 8080,
  db: {
    connectionString: process.env.DATABASE_URL
  },
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: "7d",
  nodeEnv: process.env.NODE_ENV || "development"
};
