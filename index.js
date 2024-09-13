const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// [SECTION] Routes
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");

// Server setup
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Customizing cors options to meet specific requirements
const corsOptions = {
  origin: ["http://localhost:8000"], // Allow requests from this origin
  credentials: true, // allow credentials
  optionsSuccessStatus: 200, // Provide a status code to use for successful OPTIONS request
};

// app.use(cors(corsOptions));
app.use(cors());


// Database Connection
mongoose.connect(process.env.MONGODB_STRING);

mongoose.connection.once("open", () =>
  console.log("Now connected to MongoDB Atlas")
);

// [SECTION] Backend Routes
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/carts", cartRoutes);
app.use("/orders", orderRoutes);

// Server Gateway Response
if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`API is now online on port ${process.env.PORT || 3000}`);
  });
}

// Fix the export typo
module.exports = { app, mongoose };
