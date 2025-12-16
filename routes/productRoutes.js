const express = require("express");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ADD PRODUCT (Protected)
router.post("/add", protect, async (req, res) => {
  try {
    const { name, price, quantity, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const product = await Product.create({
      name,
      price,
      quantity,
      category,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Product added successfully",
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL PRODUCTS (Public)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET PRODUCTS WITH PAGINATION & FILTER
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const category = req.query.category;

    const query = category ? { category } : {};

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
