const express = require("express");
const cartController = require("../controllers/cart");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

// Retrieve cart route
router.get("/get-cart", verify, cartController.retrieveCart);

// add cart route
router.post("/add-to-cart", verify, cartController.addToCart);

// Update cart quantity route
router.patch(
  "/update-cart-quantity",
  verify,
  cartController.updateCartQuantity
);

// Remove from cart route
router.patch(
  "/:productId/remove-from-cart",
  verify,
  cartController.removeFromCart
);

// Clear cart route
router.put("/clear-cart", verify, cartController.clearCart);

module.exports = router;
