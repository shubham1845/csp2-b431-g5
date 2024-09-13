const express = require("express");
const userController = require("../controllers/user");
const crypto = require("crypto");
const { verify } = require("../auth");

const router = express.Router();

// Register user route
router.post("/register", userController.registerUser);
router.get("/confirm-email/:token", userController.confirmEmail);
// //login
router.post("/login", userController.loginUser);

// Route to request a password reset
router.post("/request-password-reset", userController.requestPasswordReset);

// Route to reset password
router.post("/reset-password/:id/:token", userController.resetPassword);
// Route for retrieving user details
router.get("/details", verify, userController.getProfile);

module.exports = router;
