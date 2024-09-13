const Product = require("../models/Product");
const auth = require("../auth");
const { errorHandler } = require("../auth");

module.exports.createProduct = (req, res) => {
  let newProduct = new Product({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    isActive: req.body.isActive,
  });

  Product.findOne({ name: req.body.name })
    .then((existingProduct) => {
      if (existingProduct) {
        return res
          .status(409)
          .send({ message: "This product already exists." });
      } else {
        return newProduct
          .save()
          .then((result) =>
            res.status(201).send({
              success: true,
              message: "Product added successfully",
              result: result,
            })
          )
          .catch((error) => errorHandler(error, req, res));
      }
    })
    .catch((error) => errorHandler(error, req, res));
};

// Retrieve all products
module.exports.getAllProduct = (req, res) => {
  return Product.find({})
    .then((result) => {
      if (result.length > 0) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({ message: "No Product found" });
      }
    })
    .catch((err) => errorHandler(err, req, res));
};

// Retrieve all active products
module.exports.getAllActive = (req, res) => {
  Product.find({ isActive: true })
    .then((result) => {
      if (result.length > 0) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({ message: "No active Product found" });
      }
    })
    .catch((err) => res.status(500).send(err));
};

// Retrieve a single product
module.exports.getProduct = (req, res) => {
  Product.findById(req.params.productId)
    .then((product) => {
      if (product) {
        return res.status(200).send(product);
      } else {
        return res.status(404).send({ message: "Product not found" });
      }
    })
    .catch((error) => errorHandler(error, req, res));
};

// Update product info
module.exports.updateProduct = (req, res) => {
  const productId = req.params.productId;

  const updatedProductInfo = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    isActive: req.body.isActive,
  };

  Product.findByIdAndUpdate(productId, updatedProductInfo, { new: true })
    .then((product) => {
      if (product) {
        return res.status(200).send({
          success: true,
          message: "Product updated successfully",
          product: product,
        });
      } else {
        return res.status(404).send({ message: "Product not found" });
      }
    })
    .catch((error) => errorHandler(error, req, res));
};

// Archive Product
module.exports.archiveProduct = (req, res) => {
  const updateActiveField = {
    isActive: false,
  };

  Product.findByIdAndUpdate(req.params.productId, updateActiveField, {
    new: true,
  })
    .then((product) => {
      if (product) {
        return res.status(200).send({
          success: true,
          message: "Product archived successfully",
          product: product,
        });
      } else {
        return res.status(404).send({ message: "Product not found" });
      }
    })
    .catch((error) => errorHandler(error, req, res));
};

// Activate Product
module.exports.activateProduct = (req, res) => {
  const updateActiveField = {
    isActive: true,
  };

  Product.findByIdAndUpdate(req.params.productId, updateActiveField, {
    new: true,
  })
    .then((product) => {
      if (product) {
        return res.status(200).send({
          success: true,
          message: "Product activated successfully",
          product: product,
        });
      } else {
        return res.status(404).send({ message: "Product not found" });
      }
    })
    .catch((error) => errorHandler(error, req, res));
};
// search product
module.exports.searchProductByName = async (req, res) => {
  try {
    // const { name } = req.query;
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ message: "Please provide a product name to search for." });
    }

    // Use a case-insensitive search using a regular expression
    const products = await Product.find({ name: new RegExp(name, "i") });

    if (products.length > 0) {
      return res.status(200).json(products);
    } else {
      return res
        .status(404)
        .json({ message: "No products found with the given name." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};
// search product by price range
module.exports.searchProductByPriceRange = async (req, res) => {
  try {
    // const { minPrice, maxPrice } = req.query;
    const { minPrice, maxPrice } = req.body;

    if (!minPrice || !maxPrice) {
      return res.status(400).json({
        message: "Please provide both minPrice and maxPrice for the search.",
      });
    }

    // Convert to numbers
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);

    if (isNaN(min) || isNaN(max)) {
      return res
        .status(400)
        .json({ message: "Invalid price values provided." });
    }

    // Find products within the price range
    const products = await Product.find({
      price: { $gte: min, $lte: max },
    });

    if (products.length > 0) {
      return res.status(200).json(products);
    } else {
      return res
        .status(404)
        .json({ message: "No products found within the given price range." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};
