import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import avocadoSalesData from "./data/avocado-sales.json";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

console.log("Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB successfully connected!"))
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); 
  });

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

// Seed Database (if RESET_DB is set)
if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    console.log("Resetting database...");
    try {
      await AvocadoSale.deleteMany({});
      await AvocadoSale.insertMany(avocadoSalesData);
      console.log("Database seeded successfully!");
    } catch (error) {
      console.error("Error seeding database:", error.message);
    }
  };
  seedDatabase();
}

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Avocado Sales API!",
    endpoints: ["/avocado-sales", "/avocado-sales/:id"],
  });
});

// Fetch All Sales with Filters (Collection of Results)
app.get("/avocado-sales", async (req, res) => {
  const { region, date, min, max } = req.query;
  const query = {};

  // Add filters to the query
  if (region) {
    query.region = new RegExp(region, "i"); 
  }
  if (date) {
    query.date = date; 
  }
  if (min || max) {
    query.averagePrice = {};
    if (min) query.averagePrice.$gte = Number(min); 
    if (max) query.averagePrice.$lte = Number(max); 
  }

  try {
    const sales = await AvocadoSale.find(query);
    if (sales.length === 0) {
      return res.status(404).json({ error: "No sales data found with the provided filters." });
    }
    res.json(sales);
  } catch (error) {
    console.error("❌ Error retrieving avocado sales:", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Fetch Single Sale by ID (Single Result)
app.get("/avocado-sales/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const sale = await AvocadoSale.findOne({ id: Number(id) });
    if (!sale) {
      return res.status(404).json({ error: "No sale found with the provided ID." });
    }
    res.json(sale);
  } catch (error) {
    console.error("❌ Error retrieving sale by ID:", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
