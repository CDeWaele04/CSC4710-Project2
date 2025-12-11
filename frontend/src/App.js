import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./AuthContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import NewRequest from "./pages/NewRequest";
import Dashboard from "./pages/Dashboard";
import UploadPhotos from "./pages/UploadPhotos";
import ViewPhotos from "./pages/ViewPhotos";
import AdminRequests from "./pages/AdminRequests";
import AdminReject from "./pages/AdminReject";
import AdminSendQuote from "./pages/AdminSendQuote";
import MyRequests from "./pages/MyRequests";
import RequestQuotes from "./pages/RequestQuotes";
import NegotiationMessages from "./pages/NegotiationMessages";
import AdminNegotiationMessages from "./pages/AdminNegotiationMessages";
import ClientBill from "./pages/ClientBill";
import AdminBill from "./pages/AdminBill";
import AdminOrders from "./pages/AdminOrders";
import ViewBill from "./pages/ViewBill";
import MyBills from "./pages/MyBills";
import AdminBills from "./pages/AdminBills";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<div>Welcome to Cleaning Services</div>} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/requests/new" element={<NewRequest />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/requests/:request_id/photos" element={<UploadPhotos />} />
          <Route path="/requests/:request_id/photos/view" element={<ViewPhotos />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/request/:request_id/reject" element={<AdminReject />} />
          <Route path="/admin/request/:request_id/quote" element={<AdminSendQuote />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/requests/:request_id/quotes" element={<RequestQuotes />} />
          <Route path="/requests/:request_id/messages" element={<NegotiationMessages />} />
          <Route path="/admin/request/:request_id/messages" element={<AdminNegotiationMessages />} />
          <Route path="/orders/:order_id/bill" element={<ClientBill />} />
          <Route path="/admin/order/:order_id/bill" element={<AdminBill />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/orders/:order_id/bill" element={<ViewBill />} />
          <Route path="/my-bills" element={<MyBills />} />
          <Route path="/admin/bills" element={<AdminBills />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}