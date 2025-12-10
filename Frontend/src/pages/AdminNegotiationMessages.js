import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function AdminNegotiationMessages() {
  const { request_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [price, setPrice] = useState("");
  const [windowText, setWindowText] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    loadMessages();
  }, [request_id]);

  useEffect(scrollToBottom, [messages]);

  async function loadMessages() {
    try {
      const res = await api.get(`/requests/${request_id}/messages`);
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load messages");
    }
  }

  async function sendMessage() {
    if (!newMsg.trim()) return;
    try {
      await api.post(`/requests/admin/request/${request_id}/message`, {
        text: newMsg,
      });
      setNewMsg("");
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send message");
    }
  }

  const bubbleStyle = (sender) => ({
    maxWidth: "60%",
    padding: "10px 14px",
    borderRadius: "15px",
    marginBottom: "8px",
    color: sender === "anna" ? "white" : "black",
    backgroundColor: sender === "anna" ? "#1E90FF" : "#e5e5ea",
    alignSelf: sender === "anna" ? "flex-end" : "flex-start",
  });

  async function sendUpdatedQuote() {
    if (!price || !windowText) {
      setError("Price and time window required.");
      return;
    }

    try {
      await api.post(`/requests/admin/request/${request_id}/quote/update`, {
        adjusted_price: price,
        scheduled_time_window: windowText,
        note,
      });

      setShowQuoteForm(false);
      setPrice("");
      setWindowText("");
      setNote("");
      loadMessages();

    } catch (err) {
      setError(err.response?.data?.error || "Failed to send updated quote");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Negotiation Messages (Admin) — Request #{request_id}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "15px",
          height: "400px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={bubbleStyle(m.sender)}>
            <strong>{m.sender === "anna" ? "You (Anna)" : "Client"}:</strong>
            <br />
            {m.text}
            <div
              style={{
                fontSize: "0.75em",
                textAlign: m.sender === "anna" ? "right" : "left",
                marginTop: "4px",
                opacity: 0.7,
              }}
            >
              {new Date(m.timestamp).toLocaleString()}
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Admin message box */}
      <div style={{ marginTop: "15px" }}>
        <textarea
          placeholder="Write a message to client..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          style={{ width: "60%", height: "60px" }}
        />
        <br />
        <button onClick={sendMessage}>Send Message</button>
      </div>

      {/* UPDATED QUOTE BUTTON */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setShowQuoteForm(!showQuoteForm)}>
          {showQuoteForm ? "Cancel Updated Quote" : "Send Updated Quote"}
        </button>
      </div>

      {/* INLINE UPDATED QUOTE FORM */}
      {showQuoteForm && (
        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            width: "350px",
          }}
        >
          <h3>Send Updated Quote</h3>

          <label>Adjusted Price:</label><br />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: "100%" }}
          /><br /><br />

          <label>Time Window:</label><br />
          <input
            value={windowText}
            onChange={(e) => setWindowText(e.target.value)}
            style={{ width: "100%" }}
          /><br /><br />

          <label>Note (optional):</label><br />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: "100%", height: "60px" }}
          ></textarea>
          <br /><br />

          <button onClick={sendUpdatedQuote}>Submit Updated Quote</button>
        </div>
      )}

      <br />
      <a href="/admin/requests">← Back to Pending Requests</a>
    </div>
  );
}