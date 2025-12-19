
import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

router.post("/book-laptop", async (req,res)=>{
  const booking = await Booking.create(req.body);
  res.json(booking);
});

export default router;
