import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import OTP from "../models/Otp.js";

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
  const { email } = req.body;

  const otp = generateOTP();

  await OTP.findOneAndUpdate(
    { email },
    {
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    },
    { upsert: true }
  );

  await sendEmail(email, "Your new OTP", `<h3>${otp}</h3>`);

  res.json({ msg: "OTP resent" });
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    // ⛔ user create nahi ho raha
    // OTP temp collection me store
    await Otp.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        otpPurpose: "VERIFY_EMAIL",
        otpExpiry: Date.now() + 10 * 60 * 1000,
        tempUserData: {
          name,
          password: hashedPassword,
          mobile,
        },
      },
      { upsert: true }
    );

    await sendEmail(
      email,
      "Verify your email",
      `<h3>Your OTP is ${otp}</h3>`
    );

    res.status(200).json({ msg: "OTP sent to email" });
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
    const { email, otp, purpose, newPassword } = req.body;

    /* =========================
       VALIDATIONS
    ========================= */
    if (!email || !otp || !purpose) {
      return res.status(400).json({ msg: "Missing fields" });
    }

   
    /* =========================
       VERIFY EMAIL → CREATE USER
    ========================= */
    if (purpose === "VERIFY_EMAIL") {

       const otpDoc = await OTP.findOne({ email });
    if (!otpDoc) {
      return res.status(404).json({ msg: "OTP not found" });
    }

    if (otpDoc.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (otpDoc.otpExpiry < Date.now()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

      // safety check
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: "User already exists" });
      }

      const user = await User.create({
        name: otpDoc.tempUserData.name,
        email,
        password: otpDoc.tempUserData.password,
        mobile: otpDoc.tempUserData.mobile,
        role: "USER",
        isVerified: true,
      });

      await OTP.deleteOne({ email });

      return res.json({
        msg: "Account created successfully",
        userId: user._id,
      });
    }

    /* =========================
       RESET PASSWORD
    ========================= */
    if (purpose === "RESET_PASSWORD") {

      if (!newPassword) {
        return res.status(400).json({ msg: "New password required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      await OTP.deleteOne({ email });

      return res.json({
        msg: "Password reset successfully",
      });
    }

    /* =========================
       INVALID PURPOSE
    ========================= */
    return res.status(400).json({ msg: "Invalid OTP purpose" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
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
    "Reset your password",
    `<h3>Your OTP is ${otp}</h3>`
  );

  res.json({ msg: "OTP sent to email" });
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
