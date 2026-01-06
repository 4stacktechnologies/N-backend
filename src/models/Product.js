import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    /* =====================
       BASIC INFO
    ===================== */
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    category: {
      type: String, // Laptop, Mobile, Tablet
      required: true,
    },

    brand: { type: String, required: true },
    model: { type: String, required: true },

    /* =====================
       CONDITION INFO
    ===================== */
    condition: {
      type: String,
      enum: ["NEW", "USED"],
      required: true,
    },

    usageDuration: { type: String, default: null },

    physicalCondition: {
      type: String,
      enum: ["EXCELLENT", "GOOD", "AVERAGE", "POOR"],
      default: null,
    },

    isRefurbished: { type: Boolean, default: false },

    /* =====================
       HARDWARE DETAILS
    ===================== */
   ram: {
  size: { type: String },
  type: { type: String },
},

storage: {
  size: { type: String },
  type: { type: String },
},

charger: {
  power: { type: String },
  type: { type: String },
},


    processor: {
      company: String,     // Intel
      model: String,       // Core i5 1335U
      baseClock: String,   // 1.3 GHz
      turboClock: String,  // Up to 4.6 GHz
      cache: String,       // 12 MB Smart Cache
    },

    graphics: {
      type: String,       // Intel Iris Xe
      default: null,
    },

    /* =====================
       DISPLAY
    ===================== */
    display: {
      size: String,        // 15.6 inch
      resolution: String,  // 1920x1080
      panel: String,       // IPS
      refreshRate: String, // 60Hz
      brightness: String,  // 300 Nits
      aspectRatio: String, // 16:9
    },

    /* =====================
       SOFTWARE / OS
    ===================== */
    operatingSystem: {
      type: String, // Windows 11 Home
    },

    preInstalledSoftware: [
      {
        type: String, // MS Office 2021
      },
    ],

    /* =====================
       CONNECTIVITY & PORTS
    ===================== */
    ports: {
      usbTypeC: Number,
      usbTypeA: Number,
      hdmi: Number,
      microSD: Boolean,
      rj45: Boolean,
      headphoneJack: Boolean,
    },

    wifi: {
      type: String, // Wi-Fi 6
    },

    bluetooth: {
      type: String,
      default: null,
    },

    opticalDrive: {
      type: Boolean, // CD/DVD
      default: false,
    },

    /* =====================
       BATTERY & POWER
    ===================== */
    battery: {
      capacity: String, // 54 Wh
    },
    camera: {
      resolution: String, // 720p
    },

    audio: {
      type: String, // Dolby Atmos
    },

    microphone: {
      type: String, // Combo Mic
    },

    fingerprintReader: {
      type: Boolean,
      default: false,
    },

    /* =====================
       BUILD & DESIGN
    ===================== */
    color: String,

    keyboard: {
      backlit: { type: Boolean, default: false },
      layout: { type: String, default: null },
    },

    /* =====================
       PRICING
    ===================== */
    originalPrice: Number,

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
      type: String,
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
