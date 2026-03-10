import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema({
  productUrl: String,
  price: Number,
  rating: Number,
  reviewCount: Number,
  timestamp: { type: Date, default: Date.now }
});

export const Snapshot = mongoose.model("ProductSnapshot", snapshotSchema);