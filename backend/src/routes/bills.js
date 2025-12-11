import express from "express";
import pool from "../db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ------------------------------
   1. Create a Bill (Admin Only)
--------------------------------*/
router.post(
  "/create/:order_id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
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
  }
);

/* ------------------------------
   2. CLIENT — View ALL their bills
--------------------------------*/
router.get("/mine", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT B.bill_id, B.order_id, B.amount, B.status, B.generated_at
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE O.client_id = ?
      ORDER BY B.generated_at DESC
    `,
      [req.user.id]
    );

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
   4. CLIENT / ADMIN — Get a single bill by ORDER ID
   (used by ClientBill.js & AdminBill.js: GET /bills/:order_id)
--------------------------------*/
router.get("/:order_id", authenticateToken, async (req, res) => {
  const { order_id } = req.params;

  try {
    const [rows] = await pool.execute(
      `
      SELECT B.bill_id, B.order_id, B.amount, B.status, B.generated_at, B.paid_at,
             O.client_id
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE B.order_id = ?
    `,
      [order_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    const bill = rows[0];

    // Only owner client or admin can see
    if (!req.user.is_admin && bill.client_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(bill);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not fetch bill" });
  }
});

/* ------------------------------
   5. CLIENT / ADMIN — Get bill responses by ORDER ID
   (used by ClientBill.js & AdminBill.js: GET /bills/:order_id/responses)
--------------------------------*/
router.get("/:order_id/responses", authenticateToken, async (req, res) => {
  const { order_id } = req.params;

  try {
    // Find bill_id from order_id
    const [billRows] = await pool.execute(
      "SELECT bill_id FROM Bill WHERE order_id = ?",
      [order_id]
    );

    if (billRows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    const bill_id = billRows[0].bill_id;

    const [responses] = await pool.execute(
      `
      SELECT response_id, sender, note, timestamp
      FROM BillResponse
      WHERE bill_id = ?
      ORDER BY timestamp ASC
    `,
      [bill_id]
    );

    res.json(responses);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not fetch responses" });
  }
});

/* ------------------------------
   6. CLIENT — Pay a bill
--------------------------------*/
router.post("/:bill_id/pay", authenticateToken, async (req, res) => {
  const { bill_id } = req.params;

  try {
    // Verify that bill belongs to this user
    const [rows] = await pool.execute(
      `
      SELECT B.bill_id, O.client_id
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE B.bill_id = ?
    `,
      [bill_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    if (rows[0].client_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    // Pay the bill
    await pool.execute(
      `
      UPDATE Bill SET status = 'paid', paid_at = NOW()
      WHERE bill_id = ?
    `,
      [bill_id]
    );

    res.json({ message: "Bill paid!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not pay bill" });
  }
});

/* ------------------------------
   7. CLIENT — Dispute a bill
   (used by MyBills + ClientBill: POST /bills/:bill_id/dispute)
--------------------------------*/
router.post("/:bill_id/dispute", authenticateToken, async (req, res) => {
  const { bill_id } = req.params;
  const { note } = req.body;

  if (!note) return res.status(400).json({ error: "Note is required" });

  try {
    // Ensure bill belongs to this client
    const [rows] = await pool.execute(
      `
      SELECT B.bill_id, O.client_id
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE B.bill_id = ?
    `,
      [bill_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    if (rows[0].client_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    // Mark bill as disputed
    await pool.execute(`UPDATE Bill SET status='disputed' WHERE bill_id = ?`, [
      bill_id,
    ]);

    // Record dispute message
    await pool.execute(
      `
      INSERT INTO BillResponse (bill_id, sender, note)
      VALUES (?, 'client', ?)
    `,
      [bill_id, note]
    );

    res.json({ message: "Dispute submitted." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not dispute bill" });
  }
});

/* ------------------------------
   8. ADMIN — Respond to dispute (message only)
   (used by AdminBill: POST /bills/:bill_id/respond)
--------------------------------*/
router.post("/:bill_id/respond", authenticateToken, requireAdmin, async (req, res) => {
  const { bill_id } = req.params;
  const { note } = req.body;

  if (!note) return res.status(400).json({ error: "Note is required" });

  try {
    await pool.execute(
      `
      INSERT INTO BillResponse (bill_id, sender, note)
      VALUES (?, 'anna', ?)
    `,
      [bill_id, note]
    );

    res.json({ message: "Reply sent." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not send reply" });
  }
});

/* ------------------------------
   9. ADMIN — Revise bill amount (adjustment / discount)
   (used by AdminBill: POST /bills/:bill_id/revise)
--------------------------------*/
router.post("/:bill_id/revise", authenticateToken, requireAdmin, async (req, res) => {
  const { bill_id } = req.params;
  const { new_amount, note } = req.body;

  if (!new_amount)
    return res.status(400).json({ error: "New amount required" });

  try {
    // Set bill back to unpaid so the client can pay the revised amount
    await pool.execute(
      `
      UPDATE Bill
      SET amount = ?, status='unpaid'
      WHERE bill_id = ?
    `,
      [new_amount, bill_id]
    );

    if (note) {
      await pool.execute(
        `
        INSERT INTO BillResponse (bill_id, sender, note)
        VALUES (?, 'anna', ?)
      `,
        [bill_id, note]
      );
    }

    res.json({ message: "Bill revised." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not revise bill" });
  }
});

/* ------------------------------
   10. CLIENT — Cancel dispute
--------------------------------*/
router.post("/:bill_id/cancel", authenticateToken, async (req, res) => {
  const { bill_id } = req.params;

  try {
    // Verify bill belongs to this client
    const [rows] = await pool.execute(
      `
      SELECT B.bill_id, O.client_id
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE B.bill_id = ?
    `,
      [bill_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    if (rows[0].client_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    // Return bill to unpaid state
    await pool.execute(
      `UPDATE Bill SET status='unpaid' WHERE bill_id = ?`,
      [bill_id]
    );

    // Save message
    await pool.execute(
      `
      INSERT INTO BillResponse (bill_id, sender, note)
      VALUES (?, 'client', 'Client canceled the dispute.')
    `,
      [bill_id]
    );

    res.json({ message: "Dispute canceled; bill is now unpaid." });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not cancel dispute" });
  }
});

export default router;