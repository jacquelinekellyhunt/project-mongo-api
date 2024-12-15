import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import avocadoSalesData from "./data/avocado-sales.json";
import dotenv from "dotenv";

dotenv.config();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/avocadoSales";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB successfully connected!");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Avocado Sale schema and model
const AvocadoSale = mongoose.model(
  "AvocadoSale",
  new mongoose.Schema({
    id: Number,
    date: String,
    averagePrice: Number,
    totalVolume: Number,
    totalBagsSold: Number,
    smallBagsSold: Number,
    largeBagsSold: Number,
    xLargeBagsSold: Number,
    region: String,
  })
);

// Server configuration
const port = process.env.PORT || 8080;
const app = express();
const listEndpoints = require("express-list-endpoints");

if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    await AvocadoSale.deleteMany({}); // Clear existing data
    avocadoSalesData.forEach(async (sale) => {
      const newSale = new AvocadoSale(sale);
      await newSale.save();
    });
    console.log("Database seeded with avocado sales data");
  };
  seedDatabase();
}

// Middleware setup
app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);
  res.json({
    message: "Welcome to the Avocado Sales API!",
    endpoints: endpoints,
  });
});

// Route to get all avocado sales
app.get("/avocado-sales", async (req, res) => {
  try {
    const sales = await AvocadoSale.find();
    res.json(sales);
  } catch (error) {
    console.error("Error retrieving avocado sales:", error);
    res.status(500).send("Server error");
  }
});

// Route to get avocado sales by region
app.get("/avocado-sales/region/:region", async (req, res) => {
  const { region } = req.params;
  try {
    const sales = await AvocadoSale.find({ region: new RegExp(region, "i") });
    if (sales.length === 0) {
      return res.status(404).send("No sales data found for this region");
    }
    res.json(sales);
  } catch (error) {
    console.error("Error retrieving sales by region:", error);
    res.status(500).send("Server error");
  }
});

// Route to get avocado sales by date
app.get("/avocado-sales/date/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const sales = await AvocadoSale.find({ date });
    if (sales.length === 0) {
      return res.status(404).send("No sales data found for this date");
    }
    res.json(sales);
  } catch (error) {
    console.error("Error retrieving sales by date:", error);
    res.status(500).send("Server error");
  }
});

// Route to get avocado sales by average price range
app.get("/avocado-sales/price-range", async (req, res) => {
  const { min, max } = req.query;
  try {
    const sales = await AvocadoSale.find({
      averagePrice: { $gte: Number(min) || 0, $lte: Number(max) || Infinity },
    });
    if (sales.length === 0) {
      return res.status(404).send("No sales data found in this price range");
    }
    res.json(sales);
  } catch (error) {
    console.error("Error retrieving sales by price range:", error);
    res.status(500).send("Server error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
