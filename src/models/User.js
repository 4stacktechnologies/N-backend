import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    password: String,

    role: {
      type: String,
      default: "USER",
    },

    // ✅ NEW FIELDS
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    imageUrl: {
      type: String, // Cloudinary / S3 / any hosted image
      default: "",
    },

    // optional: store image public id (useful for delete/update)
    imagePublicId: {
      type: String,
      default: "",
    },

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
