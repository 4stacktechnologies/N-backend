import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  otpPurpose: String,
  otpExpiry: Number,
  tempUserData: Object,
});

export default mongoose.model("OTP", otpSchema);
