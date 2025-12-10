import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";

export default function AdminReject() {
  const { request_id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function handleReject(e) {
    e.preventDefault();
    try {
      const res = await api.post(`/requests/${request_id}/reject`, { note });
      setMessage("Request rejected.");
      setTimeout(() => navigate("/admin/requests"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to reject");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reject Request #{request_id}</h1>
      <form onSubmit={handleReject}>
        <label>Reason for rejection:</label><br />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: "300px", height: "100px" }}
        />
        <br />
        <button type="submit">Submit Rejection</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}