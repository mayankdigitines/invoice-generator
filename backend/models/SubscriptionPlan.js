const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true }, // unique identifier e.g. 'monthly-basic'
    durationType: {
      type: String,
      enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
      required: true,
    },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
