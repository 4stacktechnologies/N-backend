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
      type: String, // Mobile, Laptop, Tablet, etc.
      required: true,
    },

    brand: {
      type: String, // Lenovo, Apple, HP
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
      type: String,
      default: null, // Only for USED
    },

    physicalCondition: {
      type: String,
      enum: ["EXCELLENT", "GOOD", "AVERAGE", "POOR"],
      default: null,
    },

    isRefurbished: {
      type: Boolean,
      default: false,
    },

    /* =====================
       HARDWARE DETAILS
    ===================== */
    ram: {
      type: String, // 8GB, 16GB
    },

    rom: {
      type: String, // 256GB, 512GB
    },

    processor: {
      company: String, // Intel, AMD, Apple
      model: String,   // Core 5 120U
      generation: String,
    },

    graphics: {
      type: String, // Integrated / RTX 3050
      default: null,
    },

    /* =====================
       DISPLAY
    ===================== */
    display: {
      size: String,        // 15.6 inch
      resolution: String, // FHD, QHD
      panel: String,      // IPS, OLED
      refreshRate: String // 60Hz, 120Hz
    },

    /* =====================
       SOFTWARE / OS
    ===================== */
    operatingSystem: {
      type: String, // Windows 11, macOS
    },

    preInstalledSoftware: [
      {
        type: String, // MS Office 2024
      },
    ],

    /* =====================
       BUILD & DESIGN
    ===================== */
    color: {
      type: String, // Arctic Grey
    },

    keyboard: {
      backlit: {
        type: Boolean,
        default: false,
      },
      layout: {
        type: String, // QWERTY
        default: null,
      },
    },

    /* =====================
       PRICING
    ===================== */
    originalPrice: {
      type: Number,
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
      type: String, // 6 months, 1 year
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
      default: null,
    },

    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* =====================
       STATUS & MODERATION
    ===================== */
    status: {
      type: String,
      enum: ["AVAILABLE", "SOLD", "OUT_OF_STOCK"],
      default: "AVAILABLE",
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
