import { useEffect, useState } from "react";
import api from "../api";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        const res = await api.get("/requests/admin/pending");
        setRequests(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load requests");
      }
    }
    loadRequests();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Pending Service Requests</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Client</th>
            <th>Address</th>
            <th>Cleaning Type</th>
            <th>Rooms</th>
            <th>Preferred Time</th>
            <th>Budget</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((req) => (
            <tr key={req.request_id}>
              <td>{req.request_id}</td>
              <td>{req.first_name} {req.last_name}</td>
              <td>{req.service_address}</td>
              <td>{req.cleaning_type}</td>
              <td>{req.num_rooms}</td>
              <td>{new Date(req.preferred_datetime).toLocaleString()}</td>
              <td>${req.proposed_budget}</td>

              <td>
                <a
                  href={`/requests/${req.request_id}/photos/view`}
                  style={{ marginRight: "10px" }}
                >
                  View Photos
                </a>

                <a
                  href={`/admin/request/${req.request_id}/quote`}
                  style={{ marginRight: "10px" }}
                >
                  Send Quote
                </a>

                <a
                  href={`/admin/request/${req.request_id}/reject`}
                >
                  Reject
                </a>

                <a href={`/admin/request/${req.request_id}/messages`} style={{ marginRight: "10px" }}>
                Messages
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {requests.length === 0 && <p>No pending requests.</p>}
    </div>
  );
}