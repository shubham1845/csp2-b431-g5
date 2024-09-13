const express = require("express");
const orderController = require("../controllers/order");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();

// create order
router.post("/checkout", verify, orderController.checkout);

// retrieve logged in users orders
router.get("/my-orders", verify, orderController.myOrder);

// retrieve all users orders
router.get("/all-orders", verify, verifyAdmin, orderController.allOrder);

module.exports = router;
