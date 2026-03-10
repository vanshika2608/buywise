import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  email: { type: String, required: true },
  productUrl: { type: String, required: true },
  productTitle: String,
  targetPrice: { type: Number, required: true },
  currentPrice: Number,
  triggered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

alertSchema.index({ productUrl: 1, triggered: 1 });

export const Alert = mongoose.model("Alert", alertSchema);