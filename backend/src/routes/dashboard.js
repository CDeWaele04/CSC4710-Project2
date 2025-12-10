import express from "express";
import pool from "../db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Frequent clients – List the clients who completed the most service orders.
router.get("/frequent-clients", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        C.client_id,
        C.first_name,
        C.last_name,
        COUNT(O.order_id) AS completed_orders
      FROM Client C
      JOIN ServiceRequest R ON C.client_id = R.client_id
      JOIN Quote Q ON R.request_id = Q.request_id
      JOIN ServiceOrder O ON Q.quote_id = O.quote_id
      GROUP BY C.client_id
      ORDER BY completed_orders DESC;
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Uncommitted clients – 3+ requests, never completed an order.
router.get("/uncommitted-clients", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
          C.client_id,
          C.first_name,
          C.last_name,
          COUNT(R.request_id) AS total_requests
      FROM Client C
      JOIN ServiceRequest R ON C.client_id = R.client_id
      LEFT JOIN Quote Q ON R.request_id = Q.request_id
      LEFT JOIN ServiceOrder O ON Q.quote_id = O.quote_id
      GROUP BY C.client_id
      HAVING total_requests >= 3
         AND COUNT(O.order_id) = 0;
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// This month’s accepted quotes – with optional ?month=&year=
router.get("/accepted-quotes", authenticateToken, requireAdmin, async (req, res) => {
  const now = new Date();
  const month = parseInt(req.query.month) || (now.getMonth() + 1); // 1-12
  const year  = parseInt(req.query.year)  || now.getFullYear();

  try {
    const [rows] = await pool.execute(`
      SELECT 
          Q.quote_id,
          Q.adjusted_price,
          Q.scheduled_time_window,
          R.request_id,
          C.client_id,
          C.first_name,
          C.last_name,
          Q.created_at
      FROM Quote Q
      JOIN ServiceRequest R ON Q.request_id = R.request_id
      JOIN Client C ON R.client_id = C.client_id
      WHERE Q.status = 'accepted'
        AND MONTH(Q.created_at) = ?
        AND YEAR(Q.created_at) = ?;
    `, [month, year]);

    res.json({ month, year, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Prospective clients – registered but never submitted any request.
router.get("/prospective-clients", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
          C.client_id,
          C.first_name,
          C.last_name,
          C.email
      FROM Client C
      LEFT JOIN ServiceRequest R ON C.client_id = R.client_id
      WHERE R.request_id IS NULL;
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Largest job – service request with largest num_rooms ever completed (one row).
router.get("/largest-job", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
          R.request_id,
          R.num_rooms,
          C.client_id,
          C.first_name,
          C.last_name
      FROM ServiceRequest R
      JOIN Quote Q ON R.request_id = Q.request_id
      JOIN ServiceOrder O ON Q.quote_id = O.quote_id
      JOIN Client C ON R.client_id = C.client_id
      WHERE O.completed_at IS NOT NULL
      ORDER BY R.num_rooms DESC
      LIMIT 1;
    `);
    res.json(rows); // could be empty or one row
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Overdue bills – unpaid, older than one week.
router.get("/overdue-bills", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
          B.bill_id,
          B.order_id,
          B.amount,
          B.generated_at,
          C.client_id,
          C.first_name,
          C.last_name
      FROM Bill B
      JOIN ServiceOrder O ON B.order_id = O.order_id
      JOIN Quote Q ON O.quote_id = Q.quote_id
      JOIN ServiceRequest R ON Q.request_id = R.request_id
      JOIN Client C ON R.client_id = C.client_id
      WHERE B.status = 'unpaid'
        AND B.generated_at < NOW() - INTERVAL 7 DAY;
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Bad clients – never paid any overdue bill.
router.get("/bad-clients", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT C.client_id, C.first_name, C.last_name
      FROM Client C
      WHERE C.client_id IN (
          SELECT C2.client_id
          FROM Client C2
          JOIN ServiceRequest R2 ON C2.client_id = R2.client_id
          JOIN Quote Q2 ON R2.request_id = Q2.request_id
          JOIN ServiceOrder O2 ON Q2.quote_id = O2.quote_id
          JOIN Bill B2 ON O2.order_id = B2.order_id
          WHERE B2.status = 'unpaid'
            AND B2.generated_at < NOW() - INTERVAL 7 DAY
      )
      AND C.client_id NOT IN (
          SELECT C3.client_id
          FROM Client C3
          JOIN ServiceRequest R3 ON C3.client_id = R3.client_id
          JOIN Quote Q3 ON R3.request_id = Q3.request_id
          JOIN ServiceOrder O3 ON Q3.quote_id = O3.quote_id
          JOIN Bill B3 ON O3.order_id = B3.order_id
          WHERE B3.status = 'paid'
      );
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Good clients – always paid their bills within 24 hours.
router.get("/good-clients", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT 
          C.client_id,
          C.first_name,
          C.last_name
      FROM Client C
      JOIN ServiceRequest R ON C.client_id = R.client_id
      JOIN Quote Q ON R.request_id = Q.request_id
      JOIN ServiceOrder O ON Q.quote_id = O.quote_id
      JOIN Bill B ON O.order_id = B.order_id
      WHERE TIMESTAMPDIFF(HOUR, B.generated_at, B.paid_at) <= 24
        AND B.status = 'paid'
      GROUP BY C.client_id
      HAVING COUNT(B.bill_id) = (
          SELECT COUNT(*) 
          FROM Bill B2
          JOIN ServiceOrder O2 ON B2.order_id = O2.order_id
          JOIN Quote Q2 ON O2.quote_id = Q2.quote_id
          JOIN ServiceRequest R2 ON Q2.request_id = R2.request_id
          WHERE R2.client_id = C.client_id
      );
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;