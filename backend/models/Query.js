const mongoose = require('mongoose');

const querySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    adminResponse: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Query', querySchema);
