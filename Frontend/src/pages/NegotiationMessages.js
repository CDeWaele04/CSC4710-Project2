import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function NegotiationMessages() {
  const { request_id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [error, setError] = useState("");
  const [quoteId, setQuoteId] = useState(null);
  const chatEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    loadMessages();
    loadLatestQuoteId();
  }, [request_id]);

  useEffect(scrollToBottom, [messages]);

  // Load negotiation messages
  async function loadMessages() {
    try {
      const res = await api.get(`/requests/${request_id}/messages`);
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load messages");
    }
  }

  // Load latest quote ID so client can send counters
  async function loadLatestQuoteId() {
    try {
      const res = await api.get(`/requests/${request_id}/quotes`);
      if (res.data.length > 0) {
        setQuoteId(res.data[0].quote_id); // Most recent
      }
    } catch {
      // ignore
    }
  }

  // Send message (as a counter)
  async function sendMessage() {
    if (!newMsg.trim()) return;

    try {
      await api.post(`/requests/quote/${quoteId}/counter`, {
        message: newMsg,
      });
      setNewMsg("");
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send message");
    }
  }

  // Chat bubble styles
  const bubbleStyle = (sender) => ({
    maxWidth: "60%",
    padding: "10px 14px",
    borderRadius: "15px",
    marginBottom: "8px",
    color: sender === "client" ? "white" : "black",
    backgroundColor: sender === "client" ? "#1E90FF" : "#e5e5ea",
    alignSelf: sender === "client" ? "flex-end" : "flex-start",
  });

  return (
    <div style={{ padding: "20px" }}>
      <h1>Negotiation Messages — Request #{request_id}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Chat Container */}
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
            <strong>{m.sender === "client" ? "You" : "Anna"}:</strong>
            <br />
            {m.text}
            <div
              style={{
                fontSize: "0.75em",
                textAlign: m.sender === "client" ? "right" : "left",
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

      {/* Message input */}
      <div style={{ marginTop: "15px" }}>
        <textarea
          placeholder="Write a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          style={{ width: "60%", height: "60px" }}
        />
        <br />
        <button onClick={sendMessage} disabled={!quoteId}>
          Send Message
        </button>
        {!quoteId && <p>No active quote to respond to yet.</p>}
      </div>
    </div>
  );
}