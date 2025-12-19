
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import userRoutes from "./src/routes/userRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import shopRoutes from "./src/routes/shopRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/laptop_app")
.then(()=>console.log("MongoDB connected"));

app.get("/", (req, res) => {
    res.send("Laptop App API is running");
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bookings", bookingRoutes);

app.listen(5000, ()=>console.log("Server running on port 5000"));
