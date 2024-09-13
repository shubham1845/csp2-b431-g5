const Cart = require("../models/Cart");
const Product = require("../models/Product"); // Assuming you'll want to validate the product

///retrive cart controller
module.exports.retrieveCart = async (req, res) => {
  try {
    // Extract user ID from the validated JWT token
    const userId = req.user.id;

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      // If no cart is found, send a message
      return res.status(404).json({ message: "No cart found for this user" });
    }

    // Populate cart items with product details (name, price, etc.)
    const cartWithProductDetails = await Promise.all(
      cart.cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        return {
          productId: item.productId,
          productName: product ? product.name : "Product not found",
          quantity: item.quantity,
          subtotal: item.subtotal,
        };
      })
    );

    // Respond with the cart details including the product names
    return res.status(200).json({
      message: "Items in the cart retrieved successfully",
      cart: {
        ...cart.toObject(),
        cartItems: cartWithProductDetails,
      },
    });
  } catch (error) {
    // Catch any errors that occur during the process
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};


module.exports.addToCart = async (req, res) => {
  try {
    // The user's ID from the validated JWT token
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    // Validate product existence
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate the subtotal
    const subtotal = product.price * quantity;

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // If cart doesn't exist, create a new one
      cart = new Cart({
        userId,
        cartItems: [{ productId, quantity, subtotal }],
        totalPrice: subtotal,
      });
    } else {
      // If cart exists, check if the product is already in the cart
      const existingProductIndex = cart.cartItems.findIndex(
        (item) => item.productId === productId
      );

      if (existingProductIndex !== -1) {
        // Update the existing product quantity and subtotal
        cart.cartItems[existingProductIndex].quantity += quantity;
        cart.cartItems[existingProductIndex].subtotal += subtotal;
      } else {
        // Add new product to cart
        cart.cartItems.push({ productId, quantity, subtotal });
      }

      // Recalculate the total price
      cart.totalPrice += subtotal;
    }

    // Save the cart
    await cart.save();

    return res.status(201).json({
      message: "Items added to cart successfully",
      cart,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

// update cart quantity
module.exports.updateCartQuantity = async (req, res) => {
  try {
    // Extract user ID from the validated JWT token
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    // Validate that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // If no cart is found, send a message
      return res.status(404).json({ message: "No cart found for this user" });
    }

    // Find the product in the cart's items
    const productIndex = cart.cartItems.findIndex(
      (item) => item.productId === productId
    );

    if (productIndex !== -1) {
      // Update the existing product quantity and subtotal
      cart.cartItems[productIndex].quantity = quantity;
      cart.cartItems[productIndex].subtotal = product.price * quantity;
    } else {
      // Add the new product to the cart
      const newSubtotal = product.price * quantity;
      cart.cartItems.push({ productId, quantity, subtotal: newSubtotal });
    }

    // Recalculate the total price
    cart.totalPrice = cart.cartItems.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    // Save the cart
    await cart.save();

    return res.status(200).json({
      message: "Item quantity updated successfully",
      cart,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};
//
module.exports.removeFromCart = async (req, res) => {
  try {
    // Extract user ID from the validated JWT token
    const userId = req.user.id;
    const { productId } = req.params;

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // If no cart is found, send a message
      return res.status(404).json({ message: "No cart found for this user" });
    }

    // Find the product in the cart's items
    const productIndex = cart.cartItems.findIndex(
      (item) => item.productId === productId
    );

    if (productIndex !== -1) {
      // Remove the product from the cart
      cart.cartItems.splice(productIndex, 1);

      // Recalculate the total price
      cart.totalPrice = cart.cartItems.reduce(
        (total, item) => total + item.subtotal,
        0
      );

      // Save the cart
      await cart.save();

      return res.status(200).json({
        message: "Items removed from cart successfully",
        cart,
      });
    } else {
      // If the product is not found in the cart, send a message
      return res.status(404).json({ message: "Items not found in cart" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};
//Clear cart
module.exports.clearCart = async (req, res) => {
  try {
    // Extract user ID from the validated JWT token
    const userId = req.user.id;

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // If no cart is found, send a message
      return res.status(404).json({ message: "No cart found for this user" });
    }

    // Check if the cart has at least one item
    if (cart.cartItems.length > 0) {
      // Remove all items from the cart
      cart.cartItems = [];

      // Reset the total price to 0
      cart.totalPrice = 0;

      // Save the cart
      await cart.save();

      return res.status(200).json({
        message: "Cart cleared successfully",
        cart,
      });
    } else {
      // If the cart is already empty, send a message
      return res.status(400).json({ message: "Cart is already empty" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

// search product
