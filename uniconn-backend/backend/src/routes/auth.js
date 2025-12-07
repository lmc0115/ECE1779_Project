const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const config = require("../config");
const { authRequired } = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: "email, password, role are required" });
    }
    if (!["student", "organizer", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id,email,name,role,created_at`,
      [email, hash, name, role]
    );
    const user = result.rows[0];
    require("../services/notificationService")
      .notifyUserRegistered(user)
      .catch(console.error);
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query(
      "SELECT id,email,password_hash,name,role FROM users WHERE email=$1",
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    delete user.password_hash;
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", authRequired, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id,email,name,role,created_at FROM users WHERE id=$1",
      [req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/auth/profile
router.put("/profile", authRequired, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Check if email is already taken by another user
    const emailCheck = await db.query(
      "SELECT id FROM users WHERE email=$1 AND id != $2",
      [email, req.user.id]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use by another account" });
    }
    
    // Update user profile
    const result = await db.query(
      `UPDATE users 
       SET name=$1, email=$2 
       WHERE id=$3 
       RETURNING id, email, name, role, created_at`,
      [name, email, req.user.id]
    );
    
    const updatedUser = result.rows[0];
    
    // Issue new token with updated info
    const token = signToken(updatedUser);
    
    res.json({ user: updatedUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
