import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// POST /api/auth/register  (client signup)
router.post("/register", async (req, res) => {
  const { first_name, last_name, email, phone, address, password, credit_card } = req.body;
  const tokenizedCard = credit_card ? `tok_${credit_card.slice(-4)}` : null;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [existing] = await pool.execute(
      "SELECT client_id FROM Client WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO Client
       (first_name, last_name, email, phone, address, credit_card_token, password_hash, is_admin)
       VALUES (?, ?, ?, ?, ?, NULL, ?, 0)`,
      [first_name, last_name, email, phone || null, address || null, hash]
    );

    const clientId = result.insertId;
    const token = jwt.sign(
      { id: clientId, is_admin: 0 },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({ token, user: { id: clientId, first_name, last_name, email, is_admin: 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/auth/login  (client OR Anna)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const [rows] = await pool.execute(
      "SELECT client_id, first_name, last_name, email, password_hash, is_admin FROM Client WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.client_id, is_admin: !!user.is_admin },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.client_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        is_admin: !!user.is_admin,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;