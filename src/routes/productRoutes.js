import express from "express";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

/* =========================
   CREATE PRODUCT
   ADMIN / SUPERADMIN / OWNER
========================= */
router.post(
  "/create",
  protect,
  allowRoles("ADMIN", "SUPERADMIN", "OWNER"),
  async (req, res) => {
    try {
      const user = req.user;

      // OWNER can create only for own shop
      if (user.role === "OWNER" && user.shopId?.toString() !== req.body.shopId) {
        return res.status(403).json({ msg: "Cannot add product to this shop" });
      }

      const product = await Product.create({
        ...req.body,
        ownerId: user._id
      });

      res.status(201).json({
        msg: "Product created",
        product
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

/* =========================
   GET ALL PRODUCTS
   PUBLIC
========================= */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("shopId")
      .populate("ownerId", "name email");

    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
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
      if (!product)
        return res.status(404).json({ msg: "Product not found" });

      // OWNER can update only own products
      if (
        req.user.role === "OWNER" &&
        product.ownerId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ msg: "Access denied" });
      }

      const updated = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      res.json({
        msg: "Product updated",
        product: updated
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

/* =========================
   DELETE PRODUCT
========================= */
router.delete(
  "/:id",
  protect,
  allowRoles("ADMIN", "SUPERADMIN", "OWNER"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product)
        return res.status(404).json({ msg: "Product not found" });

      // OWNER restriction
      if (
        req.user.role === "OWNER" &&
        product.ownerId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ msg: "Access denied" });
      }

      await Product.findByIdAndDelete(req.params.id);

      res.json({ msg: "Product deleted" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

export default router;
