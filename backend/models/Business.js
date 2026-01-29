const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String },
    email: { type: String },
    phone: { type: String },
    logoUrl: { type: String },
    subscription: {
      planType: {
        type: String,
        enum: ['monthly', 'yearly'],
      },
      amount: {
        type: Number,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'inactive'],
        default: 'inactive',
      },
      paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending',
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Business', businessSchema);
