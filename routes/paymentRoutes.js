const express = require("express");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const protect = require("../middleware/authMiddleware");
const Order = require("../models/Order"); // ✅ REQUIRED

const router = express.Router();

/* ============================
   CREATE RAZORPAY ORDER
============================ */
router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================
   VERIFY PAYMENT & UPDATE DB
============================ */
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentStatus = "paid";
    order.paymentId = razorpay_payment_id;
    order.status = "processing";

    await order.save();

    res.status(200).json({
      message: "Payment verified & order updated",
      order
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
