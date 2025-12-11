import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function ClientBill() {
  const { order_id } = useParams();
  const [bill, setBill] = useState(null);
  const [responses, setResponses] = useState([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadBill();
    loadResponses();
  }, [order_id]);

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  async function loadBill() {
    try {
      const res = await api.get(`/bills/${order_id}`);
      setBill(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load bill");
    }
  }

  async function loadResponses() {
    try {
      const res = await api.get(`/bills/${order_id}/responses`);
      setResponses(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function disputeBill() {
    if (!note.trim()) return;

    try {
      await api.post(`/bills/${bill.bill_id}/dispute`, { note });
      setNote("");
      loadResponses();
      loadBill();
      setMsg("Dispute submitted.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Failed to dispute bill");
    }
  }

  async function payBill() {
    try {
      await api.post(`/bills/${bill.bill_id}/pay`);
      loadBill();
      setMsg("Bill paid!");
    } catch (err) {
      setMsg(err.response?.data?.error || "Payment failed");
    }
  }

  async function cancelDispute() {
    try {
      await api.post(`/bills/${bill.bill_id}/cancel`);
      loadBill();
      loadResponses();
      setMsg("Dispute canceled.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Failed to cancel dispute");
    }
  }

  const bubbleStyle = (sender) => ({
    maxWidth: "60%",
    padding: "10px 14px",
    borderRadius: "15px",
    marginBottom: "8px",
    backgroundColor: sender === "client" ? "#1E90FF" : "#ccc",
    color: sender === "client" ? "white" : "black",
    alignSelf: sender === "client" ? "flex-end" : "flex-start",
  });

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bill for Order #{order_id}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      {bill && (
        <>
          <p><b>Amount:</b> ${bill.amount}</p>
          <p><b>Status:</b> {bill.status}</p>
          <p><b>Generated:</b> {new Date(bill.generated_at).toLocaleString()}</p>

          {/* Pay button */}
          {bill.status === "unpaid" && (
            <button onClick={payBill}>Pay Now</button>
          )}

          {/* Cancel Dispute button */}
          {bill.status === "disputed" && (
            <button
              style={{ marginLeft: "10px" }}
              onClick={cancelDispute}
            >
              Cancel Dispute
            </button>
          )}
        </>
      )}

      <hr />

      <h2>Bill Dispute Messages</h2>

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
            <strong>{r.sender === "client" ? "You" : "Anna"}:</strong><br />
            {r.note}
            <div style={{ fontSize: "0.75em", opacity: 0.7, marginTop: "4px" }}>
              {new Date(r.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Client dispute input */}
      {bill?.status !== "paid" && (
        <div style={{ marginTop: "15px" }}>
          <textarea
            placeholder="Enter dispute message..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: "60%", height: "60px" }}
          ></textarea>
          <br />
          <button onClick={disputeBill}>Submit Dispute</button>
        </div>
      )}
    </div>
  );
}