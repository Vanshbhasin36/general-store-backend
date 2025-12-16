const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/cart/add
 * @desc    Add product to cart
 * @access  Protected
 */
router.post("/add", protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity: quantity || 1 }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity || 1;
      } else {
        cart.items.push({ product: productId, quantity: quantity || 1 });
      }

      await cart.save();
    }

    res.status(200).json({
      message: "Product added to cart",
      cart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/cart
 * @desc    Get logged-in user's cart
 * @access  Protected
 */
router.get("/", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "name price category");

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/cart/update
 * @desc    Update product quantity in cart
 * @access  Protected
 */
router.put("/update", protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "Product ID and quantity required" });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        item => item.product.toString() !== productId
      );
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    res.json({
      message: "Cart updated successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
