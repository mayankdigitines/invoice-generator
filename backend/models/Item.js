const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    gstRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // (Percentage)
  },
  { timestamps: true },
);

module.exports = mongoose.model('Item', itemSchema);
