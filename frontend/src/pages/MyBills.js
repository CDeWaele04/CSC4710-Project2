import { useEffect, useState } from "react";
import api from "../api";

export default function MyBills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    api.get("/bills/mine").then(res => setBills(res.data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Bills</h1>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Order ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Generated</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {bills.map(b => (
            <tr key={b.bill_id}>
              <td>{b.bill_id}</td>
              <td>{b.order_id}</td>
              <td>${b.amount}</td>
              <td>{b.status}</td>
              <td>{new Date(b.generated_at).toLocaleString()}</td>
              <td>
                {b.status === "unpaid" && (
                  <button onClick={() => api.post(`/bills/${b.bill_id}/pay`).then(() => window.location.reload())}>
                    Pay Now
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}