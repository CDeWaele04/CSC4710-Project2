import { useEffect, useState } from "react";
import axios from "../axiosConfig";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const res = await axios.get("/requests/admin/orders");
    setOrders(res.data);
  };

  const markComplete = async (order_id) => {
    await axios.post(`/requests/orders/${order_id}/complete`);
    loadOrders();
  };

  const generateBill = async (order_id) => {
    const amount = prompt("Enter bill amount:");
    if (!amount) return;
    await axios.post(`/requests/bills/${order_id}/create`, { amount });
    alert("Bill created!");
  };

  return (
    <div>
      <h2>All Service Orders</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Client</th>
            <th>Price</th>
            <th>Scheduled Window</th>
            <th>Created</th>
            <th>Completed</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map(o => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td>{o.first_name} {o.last_name}</td>
              <td>${o.price}</td>
              <td>{o.scheduled_time_window}</td>
              <td>{o.created_at}</td>
              <td>{o.completed_at || "Not completed"}</td>

              <td>
                {!o.completed_at && (
                  <button onClick={() => markComplete(o.order_id)}>
                    Complete Job
                  </button>
                )}

                <button onClick={() => generateBill(o.order_id)}>
                  Generate Bill
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}