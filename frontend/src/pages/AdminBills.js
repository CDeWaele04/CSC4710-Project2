import { useEffect, useState } from "react";
import api from "../api";

export default function AdminBills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    api.get("/bills/all").then(res => setBills(res.data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>All Bills</h1>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Order ID</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Generated</th>
          </tr>
        </thead>

        <tbody>
          {bills.map(b => (
            <tr key={b.bill_id} style={{ background: b.status === "unpaid" ? "#fdd" : "#dfd" }}>
              <td>{b.bill_id}</td>
              <td>{b.order_id}</td>
              <td>{b.first_name} {b.last_name}</td>
              <td>${b.amount}</td>
              <td>{b.status}</td>
              <td>{new Date(b.generated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}