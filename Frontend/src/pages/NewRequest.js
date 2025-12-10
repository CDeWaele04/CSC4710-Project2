// src/pages/NewRequest.js
import { useState } from "react";
import api from "../api";

export default function NewRequest() {
  const [form, setForm] = useState({
    service_address: "",
    cleaning_type: "basic",
    num_rooms: 1,
    preferred_datetime: "",
    proposed_budget: "",
    notes: "",
  });

  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await api.post("/requests", form);
      
      setMessage(
  <>
    Request submitted! ID = {res.data.request_id}
    <br />
    <a href={`/requests/${res.data.request_id}/photos`}>Upload Photos</a>
    <br />
    <a href={`/requests/${res.data.request_id}/photos/view`}>View Photos</a>
  </>
);


    } catch (err) {
      setMessage(err.response?.data?.error || "Error submitting request");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>New Cleaning Request</h1>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Service Address:</label><br />
          <input
            value={form.service_address}
            onChange={(e) => updateField("service_address", e.target.value)}
            style={{ width: "300px" }}
          />
        </div>

        <div>
          <label>Type:</label><br />
          <select
            value={form.cleaning_type}
            onChange={(e) => updateField("cleaning_type", e.target.value)}
          >
            <option value="basic">Basic</option>
            <option value="deep">Deep</option>
            <option value="move-out">Move-out</option>
          </select>
        </div>

        <div>
          <label>Rooms:</label><br />
          <input
            type="number"
            min="1"
            value={form.num_rooms}
            onChange={(e) => updateField("num_rooms", e.target.value)}
          />
        </div>

        <div>
          <label>Preferred Date/Time:</label><br />
          <input
            type="datetime-local"
            value={form.preferred_datetime}
            onChange={(e) => updateField("preferred_datetime", e.target.value)}
          />
        </div>

        <div>
          <label>Proposed Budget:</label><br />
          <input
            type="number"
            step="0.01"
            value={form.proposed_budget}
            onChange={(e) =>
              updateField("proposed_budget", e.target.value)
            }
          />
        </div>

        <div>
          <label>Notes:</label><br />
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            style={{ width: "300px", height: "100px" }}
          />
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Submit Request
        </button>
      </form>
    </div>
  );
}