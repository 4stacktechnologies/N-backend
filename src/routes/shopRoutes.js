import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

/* =========================
   GET ALL USERS
   ADMIN / SUPERADMIN
========================= */
router.get(
  "/users",
  protect,
  allowRoles("ADMIN", "SUPERADMIN"),
  async (req, res) => {
    try {
      const users = await User.find()
        .select("-password")
        .populate("shopId");

      res.json(users);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

/* =========================
   GET USERS BY SHOP
========================= */
router.get(
  "/users/shop/:shopId",
  protect,
  allowRoles("ADMIN", "SUPERADMIN"),
  async (req, res) => {
    try {
      const users = await User.find({ shopId: req.params.shopId })
        .select("-password")
        .populate("shopId");

      res.json(users);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

export default router;
