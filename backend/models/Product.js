import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title:        String,
  url:          { type: String, unique: true, index: true },
  category:     { type: String, default: "uncategorized" },
  price:        Number,
  rating:       Number,
  reviewCount:  Number,
  image:        String,
  riskScore:    { type: Number, default: 0 },
  riskLevel:    { type: String, enum: ["LOW","MEDIUM","HIGH"], default: "LOW" },
  analyzedCount:{ type: Number, default: 1 },
  lastAnalyzed: { type: Date, default: Date.now },
  createdAt:    { type: Date, default: Date.now },
});

export default mongoose.model("Product", productSchema);