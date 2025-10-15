import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Middleware
app.use(cors());               // Enable cross-origin requests
app.use(express.json());       // Parse JSON bodies

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Nutri API running");
});

// ✅ User routes
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));