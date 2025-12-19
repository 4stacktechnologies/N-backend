import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/create-admin",
  protect,
  allowRoles("SUPERADMIN"),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ msg: "User already exists" });

      const hashed = await bcrypt.hash(password, 10);

      const admin = await User.create({
        name,
        email,
        password: hashed,
        role: "ADMIN",
        isVerified: true
      });

      res.status(201).json({
        msg: "Admin created",
        admin
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

/* ============================
   CREATE OWNER + SHOP
   (SUPERADMIN)
============================ */
router.post(
  "/create-owner",
  protect,
  allowRoles("ADMIN"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        shopName,
        shopUID,
        shopMobile
      } = req.body;

      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ msg: "User already exists" });

      const hashed = await bcrypt.hash(password, 10);

      // Create owner
      const owner = await User.create({
        name,
        email,
        password: hashed,
        role: "OWNER",
        isVerified: true
      });

      // Create shop
      const shop = await Shop.create({
        name: shopName,
        UID: shopUID,
        mobile: shopMobile,
        email,
        ownerName: name,
        ownerEmail: email,
        ownerID: owner._id
      });

      // Link shop to owner
      owner.shopId = shop._id;
      await owner.save();

      res.status(201).json({
        msg: "Owner and shop created",
        owner,
        shop
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

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


export default router;
