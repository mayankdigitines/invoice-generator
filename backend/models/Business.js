const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String },
    email: { type: String },
    phone: { type: String },
    logoUrl: { type: String },

    // Subscription details
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
    },
    subscriptionEndDate: { type: Date },
    lastSubscriptionValidation: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Business', businessSchema);
