import { useEffect, useState } from "react";
import api from "../api";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/requests");
        setRequests(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load requests");
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Service Requests</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="8" style={{ marginTop: "15px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cleaning Type</th>
            <th>Rooms</th>
            <th>Date</th>
            <th>Budget</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((r) => (
            <tr key={r.request_id}>
              <td>{r.request_id}</td>
              <td>{r.cleaning_type}</td>
              <td>{r.num_rooms}</td>
              <td>{new Date(r.preferred_datetime).toLocaleString()}</td>
              <td>${r.proposed_budget}</td>
              <td>{r.status}</td>

              <td>
                <a href={`/requests/${r.request_id}/photos/view`}>
                  Photos
                </a>{" "}
                |{" "}
                <a href={`/requests/${r.request_id}/photos`}>
                  Upload
                </a>{" "}
                |{" "}
                <a href={`/requests/${r.request_id}/quotes`}>
                  Quotes
                </a>{" "}
                |{" "}
                <a href={`/requests/${r.request_id}/messages`}>
                  Messages
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {requests.length === 0 && <p>No requests yet.</p>}
    </div>
  );
}