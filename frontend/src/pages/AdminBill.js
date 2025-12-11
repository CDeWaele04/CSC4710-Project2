import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function AdminBill() {
  const { order_id } = useParams();
  const [bill, setBill] = useState(null);
  const [responses, setResponses] = useState([]);
  const [reply, setReply] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadBill();
    loadResponses();
  }, [order_id]);

  async function loadBill() {
    const res = await api.get(`/bills/${order_id}`);
    setBill(res.data);
  }

  async function loadResponses() {
    const res = await api.get(`/bills/${order_id}/responses`);
    setResponses(res.data);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function sendReply() {
    if (!reply.trim()) return;

    await api.post(`/bills/${bill.bill_id}/respond`, {
      note: reply,
    });

    setReply("");
    loadResponses();
  }

  async function reviseBill() {
    if (!editAmount) return;

    await api.post(`/bills/${bill.bill_id}/revise`, {
      new_amount: editAmount,
      note: reply || "Bill adjusted",
    });

    setEditAmount("");
    setReply("");
    loadBill();
    loadResponses();
    setMsg("Bill updated.");
  }

  const bubbleStyle = (sender) => ({
    maxWidth: "60%",
    padding: "10px 14px",
    borderRadius: "15px",
    marginBottom: "8px",
    backgroundColor: sender === "anna" ? "#1E90FF" : "#ccc",
    color: sender === "anna" ? "white" : "black",
    alignSelf: sender === "anna" ? "flex-end" : "flex-start",
  });

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bill (Admin View) — Order #{order_id}</h1>

      {msg && <p style={{ color: "green" }}>{msg}</p>}

      {bill && (
        <>
          <p><b>Amount:</b> ${bill.amount}</p>
          <p><b>Status:</b> {bill.status}</p>
          <p><b>Generated:</b> {new Date(bill.generated_at).toLocaleString()}</p>
        </>
      )}

      <hr />

      <h2>Dispute Messages</h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "15px",
          height: "300px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {responses.map((r) => (
          <div key={r.response_id} style={bubbleStyle(r.sender)}>
            <strong>{r.sender === "anna" ? "You (Anna)" : "Client"}</strong><br />
            {r.note}
            <div style={{ fontSize: "0.75em", opacity: 0.7, marginTop: "4px" }}>
              {new Date(r.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div style={{ marginTop: "15px" }}>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write reply to client..."
          style={{ width: "60%", height: "60px" }}
        />
        <br />
        <button onClick={sendReply}>Send Reply</button>
      </div>

      <div style={{ marginTop: "25px" }}>
        <h3>Revise Bill Amount</h3>
        <input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          placeholder="New amount"
        />
        <br /><br />
        <button onClick={reviseBill}>Update Bill</button>
      </div>
    </div>
  );
}