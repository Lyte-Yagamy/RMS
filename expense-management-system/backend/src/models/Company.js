const mongoose = require('mongoose');

/**
 * Company Schema
 * Represents an organization using the RMS platform.
 * Created automatically during admin signup.
 */
const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    baseCurrency: {
      type: String,
      required: [true, 'Base currency is required'],
      uppercase: true,
      trim: true,
      default: 'USD',
      maxlength: [3, 'Currency code must be 3 characters (e.g. USD, INR, EUR)'],
    },
    approvalRule: {
      type: Object,
      default: {
        type: 'sequential'
      }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Company', companySchema);
