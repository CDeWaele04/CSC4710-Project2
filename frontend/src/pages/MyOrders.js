import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/requests/orders");
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Orders</h1>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Request ID</th>
            <th>Price</th>
            <th>Scheduled Time</th>
            <th>Order Created</th>
            <th>Bill</th>
          </tr>
        </thead>

        <tbody>
          {orders.map(o => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td>{o.request_id}</td>
              <td>${o.price}</td>
              <td>{o.scheduled_time_window}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>

              <td>
                <Link to={`/orders/${o.order_id}/bill`}>
                  View Bill
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && <p>No orders yet.</p>}
    </div>
  );
}