import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
    },

    role: {
      type: String,
      default: "USER",
    },

    /* =====================
       PROFILE FIELDS
    ===================== */

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    avatar: {
      url: {
        type: String, // Cloudinary / S3 URL
        default: "",
      },
      publicId: {
        type: String, // Cloudinary public_id (for delete/update)
        default: "",
      },
    },

    /* =====================
       AUTH FIELDS
    ===================== */

    otp: String,
    otpExpiry: Date,

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
