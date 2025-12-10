import { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [frequent, setFrequent] = useState([]);
  const [uncommitted, setUncommitted] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [acceptedMonth, setAcceptedMonth] = useState(12);
  const [acceptedYear, setAcceptedYear] = useState(2025);
  const [prospective, setProspective] = useState([]);
  const [largestJob, setLargestJob] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [badClients, setBadClients] = useState([]);
  const [goodClients, setGoodClients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [
        freqRes,
        unRes,
        accRes,
        prosRes,
        largeRes,
        overdueRes,
        badRes,
        goodRes,
      ] = await Promise.all([
        api.get("/dashboard/frequent-clients"),
        api.get("/dashboard/uncommitted-clients"),
        api.get(`/dashboard/accepted-quotes?month=${acceptedMonth}&year=${acceptedYear}`),
        api.get("/dashboard/prospective-clients"),
        api.get("/dashboard/largest-job"),
        api.get("/dashboard/overdue-bills"),
        api.get("/dashboard/bad-clients"),
        api.get("/dashboard/good-clients"),
      ]);

      setFrequent(freqRes.data);
      setUncommitted(unRes.data);
      setAccepted(accRes.data.rows || accRes.data); // depending how backend returns
      setProspective(prosRes.data);
      setLargestJob(largeRes.data);
      setOverdue(overdueRes.data);
      setBadClients(badRes.data);
      setGoodClients(goodRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboard data");
    }
  }

  async function reloadAccepted() {
    try {
      const res = await api.get(
        `/dashboard/accepted-quotes?month=${acceptedMonth}&year=${acceptedYear}`
      );
      setAccepted(res.data.rows || res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load accepted quotes");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Anna's Dashboard</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 3. Frequent clients */}
      <section style={{ marginTop: "20px" }}>
        <h2>Frequent Clients (Most Completed Orders)</h2>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Name</th>
              <th>Completed Orders</th>
            </tr>
          </thead>
          <tbody>
            {frequent.map((c) => (
              <tr key={c.client_id}>
                <td>{c.client_id}</td>
                <td>{c.first_name} {c.last_name}</td>
                <td>{c.completed_orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 4. Uncommitted clients */}
      <section style={{ marginTop: "20px" }}>
        <h2>Uncommitted Clients (3+ Requests, No Completed Orders)</h2>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Name</th>
              <th>Total Requests</th>
            </tr>
          </thead>
          <tbody>
            {uncommitted.map((c) => (
              <tr key={c.client_id}>
                <td>{c.client_id}</td>
                <td>{c.first_name} {c.last_name}</td>
                <td>{c.total_requests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 5. This month's accepted quotes */}
      <section style={{ marginTop: "20px" }}>
        <h2>This Month's Accepted Quotes</h2>
        <div style={{ marginBottom: "8px" }}>
          Month:{" "}
          <input
            type="number"
            value={acceptedMonth}
            onChange={(e) => setAcceptedMonth(e.target.value)}
            style={{ width: "50px" }}
          />
          {" "}Year:{" "}
          <input
            type="number"
            value={acceptedYear}
            onChange={(e) => setAcceptedYear(e.target.value)}
            style={{ width: "80px" }}
          />
          {" "}
          <button onClick={reloadAccepted}>Reload</button>
        </div>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Quote ID</th>
              <th>Client</th>
              <th>Request ID</th>
              <th>Price</th>
              <th>Time Window</th>
              <th>Accepted At</th>
            </tr>
          </thead>
          <tbody>
            {accepted.map((q) => (
              <tr key={q.quote_id}>
                <td>{q.quote_id}</td>
                <td>{q.first_name} {q.last_name}</td>
                <td>{q.request_id}</td>
                <td>{q.adjusted_price}</td>
                <td>{q.scheduled_time_window}</td>
                <td>{q.created_at && new Date(q.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 6. Prospective clients */}
      <section style={{ marginTop: "20px" }}>
        <h2>Prospective Clients (Registered, No Requests)</h2>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {prospective.map((c) => (
              <tr key={c.client_id}>
                <td>{c.client_id}</td>
                <td>{c.first_name} {c.last_name}</td>
                <td>{c.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 7. Largest job */}
      <section style={{ marginTop: "20px" }}>
        <h2>Largest Job (Most Rooms Completed)</h2>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Client</th>
              <th>Rooms</th>
            </tr>
          </thead>
          <tbody>
            {largestJob.map((r) => (
              <tr key={r.request_id}>
                <td>{r.request_id}</td>
                <td>{r.first_name} {r.last_name}</td>
                <td>{r.num_rooms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 8. Overdue bills */}
      <section style={{ marginTop: "20px" }}>
        <h2>Overdue Bills (Unpaid & Older Than 1 Week)</h2>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Bill ID</th>
              <th>Order ID</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Generated At</th>
            </tr>
          </thead>
          <tbody>
            {overdue.map((b) => (
              <tr key={b.bill_id}>
                <td>{b.bill_id}</td>
                <td>{b.order_id}</td>
                <td>{b.first_name} {b.last_name}</td>
                <td>{b.amount}</td>
                <td>{new Date(b.generated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 9. Bad clients */}
      <section style={{ marginTop: "20px" }}>
        <h2>Bad Clients (Never Paid Overdue Bills)</h2>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {badClients.map((c) => (
              <tr key={c.client_id}>
                <td>{c.client_id}</td>
                <td>{c.first_name} {c.last_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 10. Good clients */}
      <section style={{ marginTop: "20px", marginBottom: "40px" }}>
        <h2>Good Clients (Always Pay Within 24 Hours)</h2>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {goodClients.map((c) => (
              <tr key={c.client_id}>
                <td>{c.client_id}</td>
                <td>{c.first_name} {c.last_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}