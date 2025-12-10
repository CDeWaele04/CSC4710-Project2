import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";

export default function AdminSendQuote() {
  const { request_id } = useParams();
  const navigate = useNavigate();

  const [price, setPrice] = useState("");
  const [window, setWindow] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.post(`/requests/${request_id}/quote`, {
        adjusted_price: price,
        scheduled_time_window: window,
        note,
      });
      setMessage("Quote sent!");
      setTimeout(() => navigate("/admin/requests"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send quote");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Send Quote for Request #{request_id}</h1>

      <form onSubmit={handleSubmit}>
        <label>Adjusted Price:</label><br />
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        /><br /><br />

        <label>Scheduled Time Window:</label><br />
        <input
          value={window}
          onChange={(e) => setWindow(e.target.value)}
        /><br /><br />

        <label>Note (optional):</label><br />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: "300px", height: "100px" }}
        />
        <br /><br />

        <button type="submit">Send Quote</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}