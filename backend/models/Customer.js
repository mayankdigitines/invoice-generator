const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
customerSchema.index({ name: 'text' });
// Compound index to ensure unique phone numbers per business
customerSchema.index({ phone: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
