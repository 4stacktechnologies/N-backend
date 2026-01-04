import express from "express";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import Perplexity from "@perplexity-ai/perplexity_ai";


import OpenAI from "openai";

const router = express.Router();

/* =========================
   UTILS
========================= */

const isOwnerAllowed = (user, product) => {
  return (
    user.role === "OWNER" &&
    product.ownerID.toString() !== user._id.toString()
  );
};

/* =========================
   CREATE PRODUCT
========================= */
router.post(
  "/",
  protect,
  allowRoles("OWNER"),
  async (req, res) => {
    try {
      const user = req.user;
      // OWNER can add product only to own shop
      if (
        user.role === "OWNER" &&
        user.shopId?.toString() !== req.body.shopId
      ) {
        return res.status(403).json({
          success: false,
          msg: "Cannot add product to another shop",
        });
      }

      // console.log("Creating product for user:", user._id);
      const product = await Product.create({
        ...req.body,
        ownerID: user._id,
      });

      res.status(201).json({
        success: true,
        msg: "Product created successfully",
        data: product,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        msg: "Product creation failed",
        error: err.message,
      });
    }
  }
);

/* =========================
   GET PRODUCTS (PUBLIC)
   Pagination + Search + Filter
========================= */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      condition,
      minPrice,
      maxPrice,
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const query = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };

    if (search?.trim()) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
            { model: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    if (condition) {
      query.condition = new RegExp(`^${condition}$`, "i");
    }

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    console.log("QUERY:", query);

    const products = await Product.find(query)
      .populate("ownerID", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Failed to fetch products",
      error: err.message,
    });
  }
});


/* =========================
   GET SINGLE PRODUCT
========================= */
router.get("/:id", async (req, res) => {
  try {
    console.log("Fetching product with ID:", req.params.id);
    const product = await Product.findOne({
      _id: req.params.id,
    })
      .populate("ownerID", "name email");

    if (!product)
      return res.status(404).json({ success: false, msg: "Product not found" });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================
   UPDATE PRODUCT
========================= */
router.put(
  "/:id",
  protect,
  allowRoles("ADMIN", "SUPERADMIN", "OWNER"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product || product.isDeleted)
        return res.status(404).json({ msg: "Product not found" });

      if (isOwnerAllowed(req.user, product))
        return res.status(403).json({ msg: "Access denied" });

      Object.assign(product, req.body);
      await product.save();

      res.json({
        success: true,
        msg: "Product updated successfully",
        data: product,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/* =========================
   SOFT DELETE PRODUCT
========================= */
router.delete(
  "/:id",
  protect,
  allowRoles("OWNER"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          msg: "Product not found",
        });
      }

      res.json({
        success: true,
        msg: "Product permanently deleted",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        msg: err.message,
      });
    }
  }
);



router.post("/extract",
protect, allowRoles("OWNER"),
  async (req, res) => {
  const client = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY,
  });


  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const prompt = `
You are a data extraction engine.
Extract laptop product details from the given text.

STRICT RULES:
- Return ONLY valid JSON
- NO markdown
- NO explanations
- If a value is missing or unknown, use null
- Do NOT guess prices
- Category is always "Laptop"
- condition must be "NEW" or "USED"
- keyboard.backlit must be true or false
- preInstalledSoftware must be an array

RETURN JSON IN THIS EXACT STRUCTURE:
{
  "basic": {
    "title": null,
    "brand": null,
    "model": null,
    "category": "Laptop",
    "description": null
  },
  "condition": {
    "condition": "NEW",
    "usageDuration": null,
    "physicalCondition": null,
    "isRefurbished": false
  },
  "hardware": {
    "ram": null,
    "rom": null,
    "processor": {
      "company": null,
      "model": null,
      "generation": null
    },
    "graphics": null
  },
  "display": {
    "size": null,
    "resolution": null,
    "panel": null,
    "refreshRate": null
  },
  "software": {
    "operatingSystem": null,
    "preInstalledSoftware": []
  },
  "design": {
    "color": null,
    "keyboard": {
      "backlit": false,
      "layout": null
    }
  },
  "extras": {
    "warrantyAvailable": false,
    "warrantyPeriod": null
  }
}

TEXT TO EXTRACT FROM:
"""
${text}
"""
`;

    const completion = await client.chat.completions.create({
      model: "sonar-pro",
      temperature: 0,
      messages: [
        { role: "system", content: "You extract structured product data." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Empty response from Perplexity");
    }

    // 🔒 Safe JSON extraction
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;

    if (start === -1 || end === -1) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(raw.slice(start, end));
    return res.json(parsed);

  } catch (error) {
    console.error("Perplexity extract error:", error.message);
    return res.status(500).json({
      message: "AI extraction failed",
      error: error.message,
    });
  }
});


export default router;