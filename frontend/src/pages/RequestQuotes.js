import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function RequestQuotes() {
  const { request_id } = useParams();
  const [quotes, setQuotes] = useState([]);
  const [counterMessage, setCounterMessage] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadQuotes();
  }, [request_id]);

  async function loadQuotes() {
    try {
      const res = await api.get(`/requests/${request_id}/quotes`);
      setQuotes(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load quotes");
    }
  }

async function acceptQuote(quote_id) {
  try {
    await api.post(`/requests/quote/${quote_id}/accept`);
    setMsg("Quote accepted!");
    loadQuotes();
  } catch (err) {
    setMsg(err.response?.data?.error || "Failed to accept quote");
  }
}

async function cancelNegotiation(quote_id) {
  try {
    await api.post(`/requests/quote/${quote_id}/cancel`);
    setMsg("Negotiation canceled.");
    loadQuotes();
  } catch (err) {
    setMsg(err.response?.data?.error || "Failed to cancel negotiation");
  }
}

async function sendCounter(quote_id) {
  try {
    await api.post(`/requests/quote/${quote_id}/counter`, {
    //           ^^^^^^^^^^^
      message: counterMessage,
    });
    setMsg("Counter message sent.");
    setCounterMessage("");
    setSelectedQuote(null);
    loadQuotes();
  } catch (err) {
    setMsg(err.response?.data?.error || "Failed to send counter");
  }
}

  return (
    <div style={{ padding: "20px" }}>
      <h1>Quotes for Request #{request_id}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <table border="1" cellPadding="8" style={{ marginTop: "15px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Adjusted Price</th>
            <th>Time Window</th>
            <th>Note</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {quotes.map((q) => (
            <tr key={q.quote_id}>
              <td>{q.quote_id}</td>
              <td>${q.adjusted_price}</td>
              <td>{q.scheduled_time_window}</td>
              <td>{q.note || "-"}</td>
              <td>{q.status}</td>

              <td>
                {q.status === "pending" && (
                  <>
                    <button onClick={() => acceptQuote(q.quote_id)}>
                      Accept
                    </button>{" "}
                    <button onClick={() => setSelectedQuote(q.quote_id)}>
                      Counter
                    </button>{" "}
                    <button onClick={() => cancelNegotiation(q.quote_id)}>
                      Cancel
                    </button>
                  </>
                )}

                {q.status !== "pending" && <i>No actions available</i>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Counter Message Panel */}
      {selectedQuote && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h3>Counter Quote #{selectedQuote}</h3>
          <textarea
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            style={{ width: "300px", height: "100px" }}
          />
          <br />
          <button onClick={() => sendCounter(selectedQuote)}>Send Counter</button>
          <button onClick={() => setSelectedQuote(null)}>Cancel</button>
        </div>
      )}

      <br /><br />
      <a href={`/requests/${request_id}/messages`}>View Negotiation Messages</a>
    </div>
  );
}