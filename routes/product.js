const express = require("express");
const productController = require("../controllers/product");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

// Create product route
router.post("/create", verify, verifyAdmin, productController.createProduct);

// Retrieve all products
router.get("/all", verify, verifyAdmin, productController.getAllProduct);

// Retrieve all active products
router.get("/active", productController.getAllActive);

// Retrieve single products using ID
router.get("/:productId",verify, productController.getProduct);

// Update product
router.patch(
  "/:productId/update",
  verify,
  verifyAdmin,
  productController.updateProduct
);

// Archive the product
router.patch(
  "/:productId/archive",
  verify,
  verifyAdmin,
  productController.archiveProduct
);

// Activate the product
router.patch(
  "/:productId/activate",
  verify,
  verifyAdmin,
  productController.activateProduct
);

// Search product by name route
router.post("/search-by-name", productController.searchProductByName);

// Search product by price range route
router.post(
  "/search-by-price",
  productController.searchProductByPriceRange
);

module.exports = router;
