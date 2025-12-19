
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  product: String,
  type: String,
  ram: String,
  rom: String,
  processor: {
    model: String,
    generation: String,
    company: String
  },
  company: String,
  model: String,
  cost: Number,
  color: String,
  image: {
    id: String,
    url: String
  },
  shopID: String,
  ownerID: String
});

export default mongoose.model("Product", productSchema);
