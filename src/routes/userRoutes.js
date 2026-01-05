import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/Otp.js";
import sendEmail from "../utils/sendEmail.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================
   HELPERS
========================= */

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const cookieOptions = {
  httpOnly: true,
  secure: false,        // true in production (HTTPS)
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* =========================
   SIGNUP → SEND OTP
========================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields required" });

    if (await User.findOne({ email }))
      return res.status(400).json({ msg: "User already exists" });

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    await OTP.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        otpPurpose: "VERIFY_EMAIL",
        otpExpiry: Date.now() + 10 * 60 * 1000,
        tempUserData: { name, password: hashedPassword, mobile },
      },
      { upsert: true }
    );

    await sendEmail(email, "Verify Email", `<h3>Your OTP: ${otp}</h3>`);

    res.json({ msg: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   RESEND OTP
========================= */
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();

  await OTP.findOneAndUpdate(
    { email },
    { otp, otpExpiry: Date.now() + 10 * 60 * 1000 },
    { upsert: true }
  );

  await sendEmail(email, "Your OTP", `<h3>${otp}</h3>`);
  res.json({ msg: "OTP resent" });
});

/* =========================
   VERIFY OTP (EMAIL / RESET)
========================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, purpose, newPassword } = req.body;

    const otpDoc = await OTP.findOne({ email });
    if (!otpDoc) return res.status(404).json({ msg: "OTP not found" });

    if (otpDoc.otp !== otp)
      return res.status(400).json({ msg: "Invalid OTP" });

    if (otpDoc.otpExpiry < Date.now())
      return res.status(400).json({ msg: "OTP expired" });

    /* ===== VERIFY EMAIL ===== */
    if (purpose === "VERIFY_EMAIL") {
      const user = await User.create({
        ...otpDoc.tempUserData,
        email,
        role: "USER",
        isVerified: true,
      });

      await OTP.deleteOne({ email });

      return res.json({ msg: "Account created", userId: user._id });
    }

    /* ===== RESET PASSWORD ===== */
    if (purpose === "RESET_PASSWORD") {
      if (!newPassword)
        return res.status(400).json({ msg: "Password required" });

      const user = await User.findOne({ email });
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      await OTP.deleteOne({ email });

      return res.json({ msg: "Password reset successful" });
    }

    res.status(400).json({ msg: "Invalid purpose" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   LOGIN → SET COOKIE
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.isVerified)
      return res.status(401).json({ msg: "Email not verified" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user);

    res.cookie("token", token, cookieOptions);

    res.json({
      msg: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   LOGOUT
========================= */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out" });
});

/* =========================
   CURRENT USER
========================= */
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

/* =========================
   SEND RESET OTP
========================= */
router.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  const otp = generateOTP();

  await OTP.findOneAndUpdate(
    { email },
    {
      otp,
      otpPurpose: "RESET_PASSWORD",
      otpExpiry: Date.now() + 10 * 60 * 1000,
    },
    { upsert: true }
  );

  await sendEmail(email, "Reset Password", `<h3>${otp}</h3>`);
  res.json({ msg: "OTP sent" });
});


/* =========================
   UPDATE BIO
========================= */
router.put("/profile/bio", protect, async (req, res) => {
  try {
    const { bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio },
      { new: true }
    ).select("-password");

    res.json({
      msg: "Bio updated successfully",
      bio: user.bio,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   UPDATE PROFILE IMAGE
========================= */
router.put("/profile/image", protect, async (req, res) => {
  try {
    const { imageUrl, imagePublicId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ msg: "Image URL required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        imageUrl,
        imagePublicId: imagePublicId || "",
      },
      { new: true }
    ).select("-password");

    res.json({
      msg: "Profile image updated",
      imageUrl: user.imageUrl,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


export default router;
