const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['subscription_purchase', 'admin_extension'],
      required: true,
    },
    planSnapshot: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
      name: { type: String },
      price: { type: Number },
      durationType: { type: String },
      durationDays: { type: Number },
    },
    previousPlanValidation: { type: Object }, // Store validation details of the previous plan if needed
    remark: { type: String }, // For admin extensions
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Transaction', transactionSchema);
