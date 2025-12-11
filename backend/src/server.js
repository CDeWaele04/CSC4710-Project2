import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import requestsRoutes from "./routes/requests.js";
import dashboardRoutes from "./routes/dashboard.js";
import path from "path";
import billRoutes from "./routes/bills.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bills", billRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});