const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String },
    email: { type: String },
    phone: { type: String },
    logoUrl: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Business', businessSchema);
