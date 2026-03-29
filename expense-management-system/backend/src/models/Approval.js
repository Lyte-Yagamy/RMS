const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Approval Model — Audit Trail
 * Acts as an immutable record for every action taken on an expense request.
 */
const approvalSchema = new Schema(
  {
    /**
     * Reference to the expense request. 
     * [cite: 19-21]
     */
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request ID is required'],
    },

    /**
     * Reference to the user (Manager/Admin/Finance) who performed the action.
     * [cite: 13, 49]
     */
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Approver ID is required'],
    },

    /**
     * The sequence step (1, 2, or 3) as per the defined workflow.
     * [cite: 24-32]
     */
    step: {
      type: Number,
      required: [true, 'Step number is required'],
      min: 0,
    },

    /**
     * The role at the time of action. 
     * Includes 'admin' for override capabilities.
     */
    role: {
      type: String,
      enum: ['manager', 'finance', 'director', 'admin'],
      required: [true, 'Approver role is required'],
    },

    /**
     * The action taken.
     */
    action: {
      type: String,
      enum: ['approved', 'rejected'],
      required: [true, 'Action is required'],
    },

    /**
     * Mandatory for rejections[cite: 36].
     */
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },

    /**
     * Whether the rule (e.g., 60% rule) was met by this specific action.
     * [cite: 40-42]
     */
    ruleMet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Captures 'createdAt' as the action timestamp
  }
);

// --- Indexes for Audit Performance ---

// For showing the "History" timeline on the Employee Dashboard [cite: 21]
approvalSchema.index({ requestId: 1, createdAt: 1 });

// For the Manager's "Action History" view [cite: 50]
approvalSchema.index({ approverId: 1, createdAt: -1 });

module.exports = mongoose.model('Approval', approvalSchema);