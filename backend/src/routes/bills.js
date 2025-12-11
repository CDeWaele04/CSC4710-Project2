import express from "express";
import pool from "../db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ------------------------------
   1. Create a Bill (Admin Only)
--------------------------------*/
router.post("/create/:order_id", authenticateToken, requireAdmin, async (req, res) => {
  const { order_id } = req.params;
  const { amount } = req.body;

  if (!amount) return res.status(400).json({ error: "Amount required" });

  try {
    await pool.execute(
      `INSERT INTO Bill (order_id, amount, due_date)
       VALUES (?, ?, NOW() + INTERVAL 7 DAY)`,
      [order_id, amount]
    );

    res.json({ message: "Bill created!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not create bill" });
  }
});

/* ------------------------------
   2. CLIENT — View ALL their bills
--------------------------------*/
router.get("/mine", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT B.bill_id, B.order_id, B.amount, B.status, B.generated_at
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE O.client_id = ?
      ORDER BY B.generated_at DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not fetch bills" });
  }
});

/* ------------------------------
   3. ADMIN — View ALL bills
--------------------------------*/
router.get("/all", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT B.bill_id, B.order_id, B.amount, B.status, B.generated_at,
             C.first_name, C.last_name
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      JOIN Client C ON O.client_id = C.client_id
      ORDER BY B.status ASC, B.generated_at DESC
    `);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not fetch bills" });
  }
});

/* ------------------------------
   4. CLIENT — Pay a bill
--------------------------------*/
router.post("/:bill_id/pay", authenticateToken, async (req, res) => {
  const { bill_id } = req.params;

  try {
    // Verify that bill belongs to this user
    const [rows] = await pool.execute(`
      SELECT B.bill_id, O.client_id
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE B.bill_id = ?
    `, [bill_id]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    if (rows[0].client_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    // Pay the bill
    await pool.execute(`
      UPDATE Bill SET status = 'paid', paid_at = NOW() WHERE bill_id = ?
    `, [bill_id]);

    res.json({ message: "Bill paid!" });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not pay bill" });
  }
});

export default router;