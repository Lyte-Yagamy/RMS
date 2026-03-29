const Request = require('../models/Request');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { notifyPaymentProcessed } = require('../services/notificationService');

/**
 * @desc    Mark a fully-approved request as paid
 * @route   PUT /api/payments/:requestId/pay
 * @access  Private — finance only
 *
 * Body: { transactionId: '...', notes: '...' }
 */
const markAsPaid = async (req, res, next) => {
  try {
    const { transactionId, notes } = req.body;

    const request = await Request.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Must be fully approved (all 3 levels passed)
    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Request must be fully approved before payment',
      });
    }

    // Must not be already paid
    if (request.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been paid',
      });
    }

    // Ensure same company
    if (request.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this company' });
    }

    // Create payment record
    const payment = await Payment.create({
      requestId: request._id,
      employeeId: request.employeeId,
      companyId: request.companyId,
      amount: request.convertedAmount || request.amount,
      transactionId: transactionId || null,
      paidBy: req.user._id,
      paidAt: new Date(),
      notes: notes || '',
    });

    // Update request payment fields
    request.paymentStatus = 'paid';
    request.paymentDate = payment.paidAt;
    request.transactionId = transactionId || null;
    await request.save();

    // Notify employee that payment has been processed
    const employee = await User.findById(request.employeeId);
    if (employee) await notifyPaymentProcessed(request, employee, transactionId);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: { payment, request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payments for the company
 * @route   GET /api/payments
 * @access  Private — finance, admin
 */
const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const payments = await Payment.find({ companyId: req.user.companyId })
      .populate('employeeId', 'name email')
      .populate('paidBy', 'name email')
      .populate('requestId', 'amount category description')
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ companyId: req.user.companyId });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { markAsPaid, getAllPayments };
