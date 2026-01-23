const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // Link to Customer Model
      required: true,
    },
    items: [
      {
        itemName: String,
        quantity: Number,
        price: Number,
        gstRate: Number,
        discount: Number,
        amount: Number,
      },
    ],
    totalAmount: Number,
    taxAmount: Number,
    grandTotal: Number,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Invoice', invoiceSchema);
