import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function AdminBills() {
  const [bills, setBills] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [newAmount, setNewAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    const res = await api.get("/bills/all");
    setBills(res.data);
  }

  async function saveEdit(bill) {
    try {
      await api.post(`/bills/${bill.bill_id}/response`, {
        new_amount: newAmount || bill.amount,
        note: adminNote || "Bill updated by admin"
      });

      setMsg("Bill updated successfully!");

      setEditRow(null);
      setNewAmount("");
      setAdminNote("");
      loadBills();
    } catch (err) {
      setMsg(err.response?.data?.error || "Failed to update bill");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>All Bills</h1>

      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Order ID</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Generated</th>
            <th>Edit</th>
            <th>Conversation</th>
          </tr>
        </thead>

        <tbody>
          {bills.map((b) => {
            const isEditing = editRow === b.bill_id;

            return (
              <tr key={b.bill_id} style={{ background: b.status === "unpaid" ? "#fdd" : "#dfd" }}>
                <td>{b.bill_id}</td>
                <td>{b.order_id}</td>
                <td>{b.first_name} {b.last_name}</td>

                {/* Amount display / edit field */}
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder={b.amount}
                    />
                  ) : (
                    `$${b.amount}`
                  )}
                </td>

                <td>{b.status}</td>
                <td>{new Date(b.generated_at).toLocaleString()}</td>

                {/* Edit controls */}
                <td>
                  {isEditing ? (
                    <>
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add admin note..."
                        style={{ width: "150px", height: "40px" }}
                      />
                      <br />
                      <button onClick={() => saveEdit(b)}>Save</button>{" "}
                      <button onClick={() => setEditRow(null)}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setEditRow(b.bill_id)}>Edit</button>
                  )}
                </td>

                {/* Link to detailed bill conversation */}
                <td>
                  <Link to={`/admin/order/${b.order_id}/bill`}>
                    Open Chat
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}