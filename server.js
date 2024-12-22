import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import avocadoSalesData from "./data/avocado-sales.json";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("🚀 MongoDB successfully connected!");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
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

const app = express();
const port = process.env.PORT || 8080;

if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    console.log("Resetting database...");
    await AvocadoSale.deleteMany({});
    await AvocadoSale.insertMany(avocadoSalesData);
    console.log("✅ Database seeded with avocado sales data!");
  };
  seedDatabase();
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Avocado Sales API!",
    endpoints: [
      { method: "GET", path: "/avocado-sales", description: "Get all sales or filter data" },
      { method: "GET", path: "/avocado-sales/:id", description: "Get a single sale by ID" },
    ],
  });
});

app.get("/avocado-sales", async (req, res) => {
  const { region, date, min, max } = req.query;
  const query = {};

  if (region) query.region = new RegExp(region, "i"); 
  if (date) query.date = date; 
  if (min || max) {
    query.averagePrice = {};
    if (min) query.averagePrice.$gte = Number(min); 
    if (max) query.averagePrice.$lte = Number(max); 
  }

  try {
    console.log("Query:", query); 
    const sales = await AvocadoSale.find(query);
    if (sales.length === 0) {
      return res.status(404).json({ error: "No sales data found with the provided filters." });
    }
    res.json(sales);
  } catch (error) {
    console.error("Error retrieving sales data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/avocado-sales/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const sale = await AvocadoSale.findById(id);
    if (!sale) {
      return res.status(404).json({ error: "No sales data found for the given ID." });
    }
    res.json(sale);
  } catch (error) {
    console.error("Error retrieving sale by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
