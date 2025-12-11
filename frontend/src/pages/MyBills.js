import { useEffect, useState } from "react";
import api from "../api";

export default function MyBills() {
  const [bills, setBills] = useState([]);
  const [disputeNotes, setDisputeNotes] = useState({}); // store notes per bill
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    const res = await api.get("/bills/mine");
    setBills(res.data);
  }

  async function payBill(bill_id) {
    try {
      await api.post(`/bills/${bill_id}/pay`);
      setMessage("Bill paid successfully!");
      loadBills();
    } catch (err) {
      setMessage(err.response?.data?.error || "Payment failed.");
    }
  }

  async function disputeBill(bill_id) {
    const note = disputeNotes[bill_id];
    if (!note || !note.trim()) {
      setMessage("Please enter a dispute note first.");
      return;
    }

    try {
      await api.post(`/bills/${bill_id}/dispute`, { note });
      setMessage("Dispute submitted!");
      setDisputeNotes({ ...disputeNotes, [bill_id]: "" });
      loadBills();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to submit dispute.");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Bills</h1>

      {message && <p style={{ color: "green" }}>{message}</p>}

      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Order ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Generated</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {bills.map((b) => (
            <tr key={b.bill_id}>
              <td>{b.bill_id}</td>
              <td>{b.order_id}</td>
              <td>${b.amount}</td>
              <td>{b.status}</td>
              <td>{new Date(b.generated_at).toLocaleString()}</td>

              <td>
                {/* VIEW FULL BILL / DISPUTE PAGE */}
                <a href={`/orders/${b.order_id}/bill`}>
                  View / Dispute
                </a>

                <br /><br />

                {/* PAY NOW */}
                {b.status === "unpaid" && (
                  <button onClick={() => payBill(b.bill_id)}>
                    Pay Now
                  </button>
                )}

                <br /><br />

                {/* DISPUTE FROM LIST */}
                {b.status !== "paid" && (
                  <div>
                    <textarea
                      placeholder="Enter dispute note..."
                      value={disputeNotes[b.bill_id] || ""}
                      onChange={(e) =>
                        setDisputeNotes({
                          ...disputeNotes,
                          [b.bill_id]: e.target.value,
                        })
                      }
                      style={{ width: "150px", height: "50px" }}
                    />
                    <br />
                    <button onClick={() => disputeBill(b.bill_id)}>
                      Submit Dispute
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {bills.length === 0 && <p>No bills found.</p>}
    </div>
  );
}