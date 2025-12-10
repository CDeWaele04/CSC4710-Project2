import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <Link to="/">Home</Link> |{" "}

      {user && !user.is_admin && (
        <>
          <Link to="/requests/new">New Request</Link> |{" "}
        </>
      )}

      {user && user.is_admin && (
        <>
          <Link to="/dashboard">Dashboard</Link> |{" "}
        </>
      )}

      {user ? (
        <button onClick={logout}>
          Logout ({user.first_name})
        </button>
      ) : (
        <>
          <Link to="/login">Login</Link> |{" "}
          <Link to="/register">Register</Link>
        </>
      )}

      {user && user.is_admin && (
        <>
          <Link to="/admin/requests">Requests</Link> |{" "}
          <Link to="/dashboard">Dashboard</Link> |{" "}
        </>
      )}

      {user && !user.is_admin && (
        <>
          <Link to="/requests/new">New Request</Link> |{" "}
          <Link to="/my-requests">My Requests</Link> |{" "}
        </>
      )}

      {user && !user.is_admin && (
        <>
          <Link to="/requests/new">New Request</Link> |{" "}
          <Link to="/my-requests">My Requests</Link> |{" "}
          <Link to="/orders">My Orders</Link> |{" "}
        </>
      )}

      {user?.is_admin && <Link to="/admin/orders">Orders</Link>}

    </nav>
  );
}
