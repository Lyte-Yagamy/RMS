const mongoose = require('mongoose');

/**
 * Approval Schema
 * Stores an audit trail of every approval/rejection action taken on a request.
 * Each record represents a single approver's decision at a specific level.
 */
const approvalSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request ID is required'],
      index: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Approver ID is required'],
    },
    approverRole: {
      type: String,
      enum: ['manager', 'finance', 'director'],
      required: [true, 'Approver role is required'],
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 3, // 1=manager, 2=finance, 3=director
    },
    action: {
      type: String,
      enum: ['approved', 'rejected'],
      required: [true, 'Approval action is required'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true, // When the action was taken
  }
);

// Compound index: one approval per approver per request
approvalSchema.index({ requestId: 1, approverId: 1 }, { unique: true });

module.exports = mongoose.model('Approval', approvalSchema);
