const mongoose = require('mongoose');

/**
 * Payment Schema
 * Records payment details after a fully-approved request is disbursed.
 * Created by finance team when marking a request as "paid".
 */
const paymentSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request ID is required'],
      unique: true, // One payment record per request
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    transactionId: {
      type: String,
      trim: true,
      default: null, // External payment gateway reference
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The finance user who processed the payment
      required: [true, 'PaidBy user is required'],
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
