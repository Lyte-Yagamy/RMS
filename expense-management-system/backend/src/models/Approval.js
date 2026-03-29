const mongoose = require('mongoose');

/**
 * Approval Schema
 * Acts as an immutable audit trail for all actions taken on a request.
 */
const approvalSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approverRole: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt
  }
);

module.exports = mongoose.model('Approval', approvalSchema);
