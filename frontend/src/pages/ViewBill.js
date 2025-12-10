import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../axiosConfig";

export default function ViewBill() {
  const { order_id } = useParams();
  const [bill, setBill] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    loadBill();
    loadResponses();
  }, []);

  const loadBill = async () => {
    const res = await axios.get(`/requests/bills/${order_id}`);
    setBill(res.data);
  };

  const loadResponses = async () => {
    const res = await axios.get(`/requests/bills/${order_id}/responses`);
    setResponses(res.data);
  };

  const pay = async () => {
    await axios.post(`/requests/bills/${bill.bill_id}/pay`);
    alert("Payment successful!");
    loadBill();
  };

  const dispute = async () => {
    const note = prompt("Enter dispute note:");
    if (!note) return;

    await axios.post(`/requests/bills/${bill.bill_id}/dispute`, { note });
    alert("Dispute sent");
    loadResponses();
  };

  if (!bill) return <p>Loading...</p>;

  return (
    <div>
      <h2>Bill for Order #{order_id}</h2>

      <p>Amount: ${bill.amount}</p>
      <p>Status: {bill.status}</p>
      <p>Generated: {bill.generated_at}</p>

      {bill.due_date && <p>Due: {bill.due_date}</p>}

      {/* Buttons */}
      {bill.status === "unpaid" && (
        <button onClick={pay}>Pay Bill</button>
      )}

      {bill.status !== "paid" && (
        <button onClick={dispute}>Dispute Bill</button>
      )}

      <h3>Messages</h3>
      <ul>
        {responses.map(r => (
          <li key={r.response_id}>
            <strong>{r.sender}:</strong> {r.note} ({r.timestamp})
          </li>
        ))}
      </ul>
    </div>
  );
}