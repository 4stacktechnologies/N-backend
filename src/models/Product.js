import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    /* =====================
       BASIC INFO
    ===================== */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String, // mobile, laptop, tablet, etc.
      required: true,
    },

    brand: {
      type: String, // Apple, Samsung, Dell
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    /* =====================
       CONDITION INFO
    ===================== */
    condition: {
      type: String,
      enum: ["NEW", "USED"],
      required: true,
    },

    usageDuration: {
      type: String, // "3 months", "1 year"
      default: null, // only for USED
    },

    physicalCondition: {
      type: String,
      enum: ["EXCELLENT", "GOOD", "AVERAGE", "POOR"],
      default: null, // only for USED
    },

    isRefurbished: {
      type: Boolean,
      default: false,
    },

    /* =====================
       HARDWARE DETAILS
    ===================== */
    ram: String, // 8GB, 16GB
    rom: String, // 128GB, 256GB

    processor: {
      model: String,
      generation: String,
      company: String,
    },

    color: String,

    /* =====================
       PRICING
    ===================== */
    originalPrice: {
      type: Number, // MRP
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    negotiable: {
      type: Boolean,
      default: false,
    },

    /* =====================
       WARRANTY
    ===================== */
    warrantyAvailable: {
      type: Boolean,
      default: false,
    },

    warrantyPeriod: {
      type: String, // "6 months", "1 year"
      default: null,
    },

    /* =====================
       IMAGES
    ===================== */
    images: [
      {
        id: String,
        url: String,
      },
    ],

    /* =====================
       SELLER INFO
    ===================== */
    shopID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },

    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* =====================
       STATUS
    ===================== */
    status: {
      type: String,
      enum: ["AVAILABLE", "SOLD", "OUT_OF_STOCK"],
      default: "AVAILABLE",
    },

    isApproved: {
      type: Boolean,
      default: false, // admin approval
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
