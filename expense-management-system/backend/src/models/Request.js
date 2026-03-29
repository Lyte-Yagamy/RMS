const mongoose = require('mongoose');

/**
 * Approver Sub-Schema
 * Tracks each approver in the multi-level approval chain.
 * Each approver has their own status independent of the overall request status.
 */
const approverSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Approver userId is required'],
    },
    role: {
      type: String,
      enum: ['manager', 'finance', 'director'],
      required: [true, 'Approver role is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
    actionDate: {
      type: Date,
      default: null, // Set when the approver takes action
    },
  },
  { _id: false } // No separate _id for sub-documents
);

/**
 * Approval Rule Sub-Schema
 * Defines the dynamic approval rule applied to this request.
 *
 * Types:
 *   - "percentage": Approve if amount is within a % threshold (e.g. <10% of budget)
 *   - "specific":   Require approval from specific named roles
 *   - "hybrid":     Combination — percentage-based up to a threshold, then specific approvers
 */
const approvalRuleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['percentage', 'specific', 'hybrid'],
      default: 'specific',
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Flexible: number for %, array for specific roles, object for hybrid
      default: null,
    },
  },
  { _id: false }
);

/**
 * Request Schema
 * Represents an expense reimbursement request submitted by an employee.
 * Supports multi-level approval workflow and payment tracking.
 *
 * Workflow:
 *   Employee submits → Manager approves → Finance verifies → Director final approval → Payment
 */
const requestSchema = new mongoose.Schema(
  {
    // ─── Core Request Info ─────────────────────────────────────────────
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },

    // ─── Expense Details ───────────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    convertedAmount: {
      type: Number,
      default: null, // Populated when currency conversion is applied
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
      enum: {
        values: [
          'travel',
          'meals',
          'accommodation',
          'office_supplies',
          'software',
          'hardware',
          'training',
          'client_entertainment',
          'communication',
          'medical',
          'other',
        ],
        message: '{VALUE} is not a valid expense category',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    receiptUrl: {
      type: String,
      trim: true,
      default: null, // URL to uploaded receipt image (populated after OCR/upload)
    },

    // ─── Approval Workflow ─────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    currentStep: {
      type: Number,
      default: 0, // Points to the index in the approvers array
      min: 0,
    },
    approvers: {
      type: [approverSchema],
      default: [], // Populated when request enters the approval pipeline
    },
    approvalRule: {
      type: approvalRuleSchema,
      default: () => ({ type: 'specific', value: null }),
    },

    // ─── Payment Tracking ──────────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paymentDate: {
      type: Date,
      default: null, // Set when finance marks as paid
    },
    transactionId: {
      type: String,
      trim: true,
      default: null, // External payment reference ID
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Indexes for common query patterns ───────────────────────────────
requestSchema.index({ status: 1, currentStep: 1 }); // Fetch pending requests at a specific step
requestSchema.index({ employeeId: 1, createdAt: -1 }); // Employee's request history
requestSchema.index({ companyId: 1, status: 1 });       // Company-wide reporting

/**
 * Virtual: Check if request is fully approved (passed all 3 levels)
 */
requestSchema.virtual('isFullyApproved').get(function () {
  return this.status === 'approved';
});

/**
 * Virtual: Check if request is ready for payment
 */
requestSchema.virtual('isPaymentReady').get(function () {
  return this.isFullyApproved && this.paymentStatus === 'pending';
});

// Ensure virtuals are included when converting to JSON/Object
requestSchema.set('toJSON', { virtuals: true });
requestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Request', requestSchema);
