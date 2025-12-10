import { useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function Register() {
  const { login } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creditCard, setCreditCard] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/auth/register", {
        ...form,
      });

      // Automatically log in after registration
      login(res.data.token, res.data.user);
      setSuccess("Registration successful!");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Create an Account</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label><br />
          <input
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
          />
        </div>

        <div>
          <label>Last Name:</label><br />
          <input
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
          />
        </div>

        <div>
          <label>Email:</label><br />
          <input
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div>
          <label>Phone:</label><br />
          <input
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>

        <div>
          <label>Address:</label><br />
          <input
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            style={{ width: "300px" }}
          />
        </div>

        <div>
          <label>Password:</label><br />
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
          />
        </div>

        <div>
          <input 
            type="text"
            placeholder="Credit Card"
            value={creditCard}
            onChange={(e) => setCreditCard(e.target.value)}
          />
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Register
        </button>
      </form>
    </div>
  );
}