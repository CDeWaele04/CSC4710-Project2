import express from "express";
import pool from "../db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ============================================================
   SECTION 1 — SERVICE REQUEST CREATION & BASIC CLIENT ACTIONS
   (Client pages: Create Request, My Requests)
   ============================================================ */

// Create a new service request
router.post("/", authenticateToken, async (req, res) => {
  const clientId = req.user.id;
  const {
    service_address,
    cleaning_type,
    num_rooms,
    preferred_datetime,
    proposed_budget,
    notes,
  } = req.body;

  if (!service_address || !cleaning_type || !num_rooms || !preferred_datetime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO ServiceRequest
       (client_id, service_address, cleaning_type, num_rooms,
        preferred_datetime, proposed_budget, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        clientId,
        service_address,
        cleaning_type,
        num_rooms,
        preferred_datetime,
        proposed_budget || null,
        notes || null,
      ]
    );

    res.status(201).json({ request_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Client: Get all their service requests
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT request_id, service_address, cleaning_type, num_rooms,
              preferred_datetime, proposed_budget, status
       FROM ServiceRequest
       WHERE client_id = ?
       ORDER BY request_id DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Client: Shortcut "My Requests" page
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM ServiceRequest WHERE client_id = ?
       ORDER BY preferred_datetime DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================================================
   SECTION 2 — PHOTO UPLOADS
   (Client page: Upload Photos for Request)
   ============================================================ */

// Upload up to 5 photos for a request
router.post("/:request_id/photos",
  authenticateToken,
  upload.array("photos", 5),
  async (req, res) => {
    const requestId = req.params.request_id;
    const clientId = req.user.id;

    // Verify request belongs to user
    const [rows] = await pool.execute(
      "SELECT client_id FROM ServiceRequest WHERE request_id = ?",
      [requestId]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Request not found" });

    if (rows[0].client_id !== clientId)
      return res.status(403).json({ error: "Not your request" });

    try {
      for (const file of req.files) {
        await pool.execute(
          "INSERT INTO RequestPhoto (request_id, file_path) VALUES (?, ?)",
          [requestId, file.filename]
        );
      }

      res.json({ message: "Photos uploaded successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  }
);

// Get photos for a request
router.get("/:request_id/photos", authenticateToken, async (req, res) => {
  const { request_id } = req.params;

  try {
    const [reqRows] = await pool.execute(
      "SELECT client_id FROM ServiceRequest WHERE request_id = ?",
      [request_id]
    );
    if (reqRows.length === 0)
      return res.status(404).json({ error: "Request not found" });

    const ownerId = reqRows[0].client_id;

    if (req.user.id !== ownerId && !req.user.is_admin)
      return res.status(403).json({ error: "Not authorized" });

    const [photos] = await pool.execute(
      "SELECT file_path FROM RequestPhoto WHERE request_id = ?",
      [request_id]
    );

    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================================================
   SECTION 3 — ADMIN MANAGES REQUESTS + SEND QUOTES
   (Admin page: Pending Requests, Send Quote)
   ============================================================ */

// Admin: View all pending or in-negotiation requests
router.get("/admin/pending", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        R.request_id,
        R.client_id,
        R.service_address,
        R.cleaning_type,
        R.num_rooms,
        R.preferred_datetime,
        R.proposed_budget,
        R.notes,
        C.first_name,
        C.last_name,
        C.email
      FROM ServiceRequest R
      JOIN Client C ON R.client_id = C.client_id
      WHERE R.status IN ('submitted', 'in_negotiation')
      ORDER BY R.preferred_datetime ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin: Reject a request
router.post("/:request_id/reject", authenticateToken, requireAdmin, async (req, res) => {
  const { request_id } = req.params;
  const { note } = req.body;

  try {
    await pool.execute(
      "UPDATE ServiceRequest SET status='rejected', notes = CONCAT(IFNULL(notes,''), ?) WHERE request_id = ?",
      [`\n[ADMIN REJECTED]: ${note}`, request_id]
    );
    res.json({ message: "Request rejected." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin: Send initial quote
router.post("/:request_id/quote", authenticateToken, requireAdmin, async (req, res) => {
  const { request_id } = req.params;
  const { adjusted_price, scheduled_time_window, note } = req.body;

  try {
    const [qResult] = await pool.execute(
      `INSERT INTO Quote (request_id, adjusted_price, scheduled_time_window, note, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [request_id, adjusted_price, scheduled_time_window, note || null]
    );

    // Mark request as in negotiation
    await pool.execute(
      "UPDATE ServiceRequest SET status='in_negotiation' WHERE request_id = ?",
      [request_id]
    );

    res.json({ quote_id: qResult.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================================================
   SECTION 4 — QUOTE / NEGOTIATION (Client & Admin)
   (Pages: Negotiation thread, Quotes list)
   ============================================================ */

// Get all quotes for a request
router.get("/:request_id/quotes", authenticateToken, async (req, res) => {
  const { request_id } = req.params;

  try {
    const [quotes] = await pool.execute(`
      SELECT 
        Q.quote_id,
        Q.adjusted_price,
        Q.scheduled_time_window,
        Q.note,
        Q.status,
        Q.created_at,
        Q.request_id
      FROM Quote Q
      WHERE Q.request_id = ?
      ORDER BY Q.created_at DESC
    `, [request_id]);

    res.json(quotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Client: Counter-offer message
router.post("/quote/:quote_id/counter", authenticateToken, async (req, res) => {
  const { quote_id } = req.params;
  const { message } = req.body;

  try {
    const [q] = await pool.execute(
      `SELECT Q.request_id, R.client_id
       FROM Quote Q
       JOIN ServiceRequest R ON Q.request_id = R.request_id
       WHERE Q.quote_id = ?`,
      [quote_id]
    );

    if (q.length === 0)
      return res.status(404).json({ error: "Quote not found" });

    if (q[0].client_id !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    // Save message
    await pool.execute(
      "INSERT INTO NegotiationMessage (request_id, sender, text) VALUES (?, 'client', ?)",
      [q[0].request_id, message]
    );

    await pool.execute(
      "UPDATE Quote SET status='countered' WHERE quote_id = ?",
      [quote_id]
    );

    res.json({ message: "Counter sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Client: Cancel negotiation
router.post("/quote/:quote_id/cancel", authenticateToken, async (req, res) => {
  const { quote_id } = req.params;

  try {
    await pool.execute(
      "UPDATE Quote SET status='rejected' WHERE quote_id = ?",
      [quote_id]
    );

    res.json({ message: "Negotiation canceled." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Negotiation message history
router.get("/:request_id/messages", authenticateToken, async (req, res) => {
  const { request_id } = req.params;

  try {
    const [rows] = await pool.execute(
      "SELECT sender, text, timestamp FROM NegotiationMessage WHERE request_id = ? ORDER BY timestamp ASC",
      [request_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin sends message
router.post("/admin/request/:request_id/message", authenticateToken, requireAdmin, async (req, res) => {
  const { request_id } = req.params;
  const { text } = req.body;

  try {
    await pool.execute(
      "INSERT INTO NegotiationMessage (request_id, sender, text) VALUES (?, 'anna', ?)",
      [request_id, text]
    );

    res.json({ message: "Message sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin: Send updated quote
router.post("/admin/request/:request_id/quote/update", authenticateToken, requireAdmin, async (req, res) => {
  const { request_id } = req.params;
  const { adjusted_price, scheduled_time_window, note } = req.body;

  if (!adjusted_price || !scheduled_time_window)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    await pool.execute(
      `INSERT INTO Quote (request_id, adjusted_price, scheduled_time_window, note, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [request_id, adjusted_price, scheduled_time_window, note || null]
    );

    await pool.execute(
      "UPDATE ServiceRequest SET status='in_negotiation' WHERE request_id = ?",
      [request_id]
    );

    res.json({ message: "Updated quote sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================================================
   SECTION 5 — QUOTE ACCEPTANCE → CREATE SERVICE ORDER
   (Client page: Accept Quote)
   ============================================================ */

// Client accepts quote — FINAL VERSION (duplicate removed)
router.post("/quote/:quote_id/accept", authenticateToken, async (req, res) => {
  const { quote_id } = req.params;

  try {
    // Get quote + client + request info
    const [quoteRows] = await pool.execute(
      `SELECT Quote.*, ServiceRequest.client_id
       FROM Quote
       JOIN ServiceRequest ON Quote.request_id = ServiceRequest.request_id
       WHERE quote_id = ?`,
      [quote_id]
    );

    if (quoteRows.length === 0)
      return res.status(404).json({ error: "Quote not found" });

    const quote = quoteRows[0];

    if (quote.client_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    const request_id = quote.request_id;

    // Accept quote
    await pool.execute(
      "UPDATE Quote SET status='accepted' WHERE quote_id = ?",
      [quote_id]
    );

    // Reject all other quotes for this request
    await pool.execute(
      "UPDATE Quote SET status='rejected' WHERE request_id = ? AND quote_id != ?",
      [request_id, quote_id]
    );

    // Update request status
    await pool.execute(
      "UPDATE ServiceRequest SET status='accepted' WHERE request_id = ?",
      [request_id]
    );

    // Create ServiceOrder
    await pool.execute(
      `INSERT INTO ServiceOrder (request_id, quote_id, client_id, price, scheduled_time_window)
       VALUES (?, ?, ?, ?, ?)`,
      [
        request_id,
        quote_id,
        quote.client_id,
        quote.adjusted_price,
        quote.scheduled_time_window
      ]
    );

    res.json({ message: "Quote accepted and order created!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================================================
   SECTION 6 — CLIENT VIEW ORDERS
   (Client page: My Orders)
   ============================================================ */

router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        O.order_id,
        O.request_id,
        O.price,
        O.scheduled_time_window,
        O.created_at,
        O.completed_at,
        R.service_address,
        R.cleaning_type
      FROM ServiceOrder O
      JOIN ServiceRequest R ON O.request_id = R.request_id
      WHERE O.client_id = ?
      ORDER BY O.order_id DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================================================
   SECTION 7 — BILLING SYSTEM (Admin + Client)
   (Pages: Bill creation, Bill view, Pay bill, Dispute bill)
   ============================================================ */

// Admin creates bill
router.post("/bills/:order_id/create", authenticateToken, requireAdmin, async (req, res) => {
  const { order_id } = req.params;
  const { amount } = req.body;

  if (!amount)
    return res.status(400).json({ error: "Amount required" });

  try {
    const [order] = await pool.execute(
      "SELECT * FROM ServiceOrder WHERE order_id = ?",
      [order_id]
    );

    if (order.length === 0)
      return res.status(404).json({ error: "Order not found" });

    await pool.execute(
      `INSERT INTO Bill (order_id, amount, due_date)
       VALUES (?, ?, NOW() + INTERVAL 7 DAY)`,
      [order_id, amount]
    );

    res.json({ message: "Bill created!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Client gets bill
router.get("/bills/:order_id", authenticateToken, async (req, res) => {
  const { order_id } = req.params;

  try {
    const [billRows] = await pool.execute(`
      SELECT 
        B.bill_id,
        B.order_id,
        B.amount,
        B.status,
        B.generated_at,
        B.paid_at,
        O.client_id
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      WHERE B.order_id = ?
    `, [order_id]);

    if (billRows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    const bill = billRows[0];

    if (bill.client_id !== req.user.id && !req.user.is_admin)
      return res.status(403).json({ error: "Unauthorized" });

    res.json(bill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Client pays bill
router.post("/bills/:bill_id/pay", authenticateToken, async (req, res) => {
  const { bill_id } = req.params;

  try {
    const [bill] = await pool.execute(
      `SELECT Bill.*, ServiceOrder.client_id
       FROM Bill
       JOIN ServiceOrder ON Bill.order_id = ServiceOrder.order_id
       WHERE bill_id = ?`,
      [bill_id]
    );

    if (bill.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    if (bill[0].client_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    await pool.execute(
      "UPDATE Bill SET status = 'paid', paid_at = NOW() WHERE bill_id = ?",
      [bill_id]
    );

    res.json({ message: "Bill paid successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Client disputes bill
router.post("/bills/:bill_id/dispute", authenticateToken, async (req, res) => {
  const { bill_id } = req.params;
  const { note } = req.body;

  if (!note)
    return res.status(400).json({ error: "Note is required" });

  try {
    await pool.execute(
      "UPDATE Bill SET status='disputed' WHERE bill_id = ?",
      [bill_id]
    );

    await pool.execute(
      `INSERT INTO BillResponse (bill_id, sender, note)
       VALUES (?, 'client', ?)`,
      [bill_id, note]
    );

    res.json({ message: "Dispute submitted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin responds to dispute
router.post("/bills/:bill_id/response", authenticateToken, requireAdmin, async (req, res) => {
  const { bill_id } = req.params;
  const { note, new_amount } = req.body;

  if (!note && !new_amount)
    return res.status(400).json({ error: "Nothing to update" });

  try {
    if (new_amount) {
      await pool.execute(
        "UPDATE Bill SET amount = ?, status = 'unpaid' WHERE bill_id = ?",
        [new_amount, bill_id]
      );
    }

    if (note) {
      await pool.execute(
        `INSERT INTO BillResponse (bill_id, sender, note)
         VALUES (?, 'anna', ?)`,
        [bill_id, note]
      );
    }

    res.json({ message: "Bill updated / response recorded." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Bill response history
router.get("/bills/:order_id/responses", authenticateToken, async (req, res) => {
  const { order_id } = req.params;

  const [billRows] = await pool.execute(
    "SELECT bill_id FROM Bill WHERE order_id = ?",
    [order_id]
  );

  if (billRows.length === 0)
    return res.status(404).json({ error: "Bill not found" });

  const bill_id = billRows[0].bill_id;

  const [responses] = await pool.execute(
    `SELECT response_id, sender, note, timestamp
     FROM BillResponse
     WHERE bill_id = ?
     ORDER BY timestamp ASC`,
    [bill_id]
  );

  res.json(responses);
});

/* ============================================================
   ADMIN: VIEW ALL ORDERS
   ============================================================ */

router.get("/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT O.order_id, O.request_id, O.price, O.scheduled_time_window,
              O.created_at, O.completed_at,
              C.client_id, C.first_name, C.last_name
       FROM ServiceOrder O
       JOIN Client C ON O.client_id = C.client_id
       ORDER BY O.order_id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================================================
   ADMIN: MARK ORDER COMPLETED
   ============================================================ */

router.post("/orders/:order_id/complete", authenticateToken, requireAdmin, async (req, res) => {
  const { order_id } = req.params;

  try {
    await pool.execute(
      "UPDATE ServiceOrder SET completed_at = NOW() WHERE order_id = ?",
      [order_id]
    );

    res.json({ message: "Order marked as completed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;