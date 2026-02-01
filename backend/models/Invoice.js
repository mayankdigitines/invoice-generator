const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // Link to Customer Model
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    items: [
      {
        itemName: String,
        itemDescription: String,
        quantity: Number,
        price: Number,
        gstRate: Number,
        discount: Number,
        amount: Number,
      },
    ],
    date: { type: Date, required: true, default: Date.now },
    overallDiscount: { type: Number, default: 0 },
    totalAmount: Number,
    taxAmount: Number,
    grandTotal: Number,
  },
  { timestamps: true },
);

// Indexes for Search & Sorting
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ date: -1 });
// Compound index for unique invoice number per business
invoiceSchema.index({ invoiceNumber: 1, businessId: 1 }, { unique: true });
invoiceSchema.index({ customer: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
