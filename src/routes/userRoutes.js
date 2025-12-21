import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/* =========================
   Helpers
========================= */

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

/* =========================
   SIGNUP + EMAIL OTP
========================= */
router.post("/resend-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose)
      return res.status(400).json({ msg: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const otp = generateOTP();

    user.otp = otp;
    user.otpPurpose = purpose;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail(
      email,
      "Your new OTP",
      `<h3>Your OTP is ${otp}</h3><p>Valid for 10 minutes</p>`
    );

    res.json({ msg: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "USER",
      otp,
      otpPurpose: "VERIFY_EMAIL",
      otpExpiry: Date.now() + 10 * 60 * 1000
    });

    await sendEmail(
      email,
      "Verify your email",
      `<h3>Your OTP is ${otp}</h3><p>Valid for 10 minutes</p>`
    );

    res.status(201).json({
      msg: "Signup successful. OTP sent to email",
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   VERIFY OTP (COMMON)
   purpose: VERIFY_EMAIL | RESET_PASSWORD
========================= */

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose)
      return res.status(400).json({ msg: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (
      user.otp !== otp ||
      user.otpPurpose !== purpose
    )
      return res.status(400).json({ msg: "Invalid OTP" });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ msg: "OTP expired" });

    if (purpose === "VERIFY_EMAIL") {
      user.isVerified = true;
    }

    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;

    await user.save();

    res.json({ msg: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   LOGIN (JWT)
========================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ msg: "User not found" });

    if (!user.isVerified)
      return res.status(401).json({ msg: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   RESET PASSWORD (SEND OTP)
========================= */

router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ msg: "User not found" });

    const otp = generateOTP();

    user.otp = otp;
    user.otpPurpose = "RESET_PASSWORD";
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail(
      email,
      "Reset Password OTP",
      `<h3>Your OTP is ${otp}</h3><p>Valid for 10 minutes</p>`
    );

    res.json({ msg: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   SET NEW PASSWORD
========================= */

router.post("/set-new-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!newPassword)
      return res.status(400).json({ msg: "Password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ msg: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
