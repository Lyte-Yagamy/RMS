/**
 * Approval Model — Audit Trail
 * 
 * Stores an immutable record for every approval or rejection action taken
 * on an expense reimbursement request. This creates a complete history of
 * who acted, when, at which step, and what they decided.
 * 
 * One Approval record is created each time processApproval() or
 * processRejection() is called in the workflowService.
 * 
 * @module models/Approval
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const approvalSchema = new Schema(
  {
    /**
     * Reference to the expense request being acted upon.
     */
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request ID is required'],
    },

    /**
     * Reference to the user who performed the action.
     */
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Approver ID is required'],
    },

    /**
     * The step index in the request's approvers array at the time of action.
     * E.g., 0 = first approver, 1 = second approver, etc.
     */
    step: {
      type: Number,
      required: [true, 'Step number is required'],
      min: 0,
    },

    /**
     * The role of the approver at the time of action.
     * Stored separately from the User model so the audit trail
     * remains accurate even if the user's role changes later.
     */
    role: {
      type: String,
      enum: ['manager', 'finance', 'director'],
      required: [true, 'Approver role is required'],
    },

    /**
     * The action taken: approved or rejected.
     */
    action: {
      type: String,
      enum: ['approved', 'rejected'],
      required: [true, 'Action is required'],
    },

    /**
     * Optional comment provided by the approver.
     * Especially important for rejections to explain the reason.
     */
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },

    /**
     * Whether the approval rule was fully satisfied after this action.
     * Useful for quickly identifying the action that completed the workflow.
     */
    ruleMet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Indexes for fast lookups ────────────────────────────────────────────────

/**
 * Fast lookup of all approval records for a specific request.
 * Used by getApprovalHistory() to show the full audit trail.
 */
approvalSchema.index({ requestId: 1, createdAt: 1 });

/**
 * Fast lookup of all actions taken by a specific approver.
 * Used by getMyActions() in the controller.
 */
approvalSchema.index({ approverId: 1, createdAt: -1 });

module.exports = mongoose.model('Approval', approvalSchema);
