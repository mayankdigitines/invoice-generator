const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    gstRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // (Percentage)
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
  },
  { timestamps: true },
);

// Compound index to ensure unique item names per business
itemSchema.index({ name: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('Item', itemSchema);
