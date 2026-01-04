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

router.get(
  "/users/all",
  protect,
  allowRoles("OWNER"),
  async (req, res) => {
    try {
      const { role, page = 1, limit = 10 } = req.query;

      const query = role ? { role } : {};

      const users = await User.find(query)
        .select("-password")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const totalUsers = await User.countDocuments(query);

      res.json({
        totalUsers,
        page: Number(page),
        limit: Number(limit),
        users
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);



router.get(
  "/dashboard",
  protect,
  allowRoles("OWNER"),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalProducts,
        totalShops,

        // Role-wise users
        usersByRole,

        // User growth
        userGrowth,

        // Product growth
        productGrowth,

        // Product category distribution
        productsByCategory
      ] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Shop.countDocuments(),

        // USERS BY ROLE
        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 }
            }
          }
        ]),

        // USERS GROWTH (MONTHLY)
        User.aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),

        // PRODUCTS GROWTH (MONTHLY)
        Product.aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),

        // PRODUCTS BY CATEGORY
        Product.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      res.json({
        summary: {
          totalUsers,
          totalProducts,
          totalShops
        },

        charts: {
          usersByRole,
          userGrowth,
          productGrowth,
          productsByCategory
        }
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

export default router;
