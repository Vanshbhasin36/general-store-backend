const express = require("express");
const Order = require("../models/Order");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// PLACE ORDER (already exists)
router.post("/place", protect, async (req, res) => {
  // existing code
});

// GET MY ORDERS (already exists)
router.get("/my", protect, async (req, res) => {
  // existing code
});

// ✅ ADMIN: GET ALL ORDERS
router.get("/all", protect, async (req, res) => {
  try {
    // allow only admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ADMIN: UPDATE ORDER STATUS
router.put("/update/:orderId", protect, async (req, res) => {
  try {
    // admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ADMIN: DASHBOARD SUMMARY
router.get("/dashboard/summary", protect, async (req, res) => {
  try {
    // admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    // total orders
    const totalOrders = await Order.countDocuments();

    // total revenue
    const revenueResult = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // orders by status
    const statusStats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      totalOrders,
      totalRevenue,
      ordersByStatus: statusStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
