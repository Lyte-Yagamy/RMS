const User = require('../models/User');
const Request = require('../models/Request');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const Approval = require('../models/Approval');
const { processApproval: workflowApproval, processRejection: workflowRejection } = require('../services/workflowService');

/**
 * Admin Controller
 * Provides user management and analytics endpoints for admin users.
 * All operations are scoped to the admin's company.
 */

/**
 * @desc    Get all users in the admin's company
 * @route   GET /api/admin/users
 * @access  Private — admin only
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = { companyId: req.user.companyId };

    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
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

/**
 * @desc    Get analytics / dashboard data for the company
 * @route   GET /api/admin/analytics
 * @access  Private — admin only
 *
 * Returns:
 *   - overview: total/pending/approved/rejected counts + amounts
 *   - categoryBreakdown: spend per category
 *   - monthlyTrend: requests per month
 *   - userStats: total users by role
 *   - paymentSummary: total paid vs pending
 */
const getAnalytics = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    // ─── Request counts ──────────────────────────────────────────────
    const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] =
      await Promise.all([
        Request.countDocuments({ companyId }),
        Request.countDocuments({ companyId, status: 'pending' }),
        Request.countDocuments({ companyId, status: 'approved' }),
        Request.countDocuments({ companyId, status: 'rejected' }),
      ]);

    // ─── Financial totals ────────────────────────────────────────────
    const totalApprovedAmount = await Request.aggregate([
      { $match: { companyId: req.user.companyId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalPaidAmount = await Payment.aggregate([
      { $match: { companyId: req.user.companyId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const pendingPayments = await Request.countDocuments({
      companyId,
      status: 'approved',
      paymentStatus: 'pending',
    });

    // ─── Category breakdown ──────────────────────────────────────────
    const categoryBreakdown = await Request.aggregate([
      { $match: { companyId: req.user.companyId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // ─── Monthly trend (last 6 months) ──────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Request.aggregate([
      {
        $match: {
          companyId: req.user.companyId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ─── User stats by role ─────────────────────────────────────────
    const userStats = await User.aggregate([
      { $match: { companyId: req.user.companyId } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments({ companyId });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRequests,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
          totalPaidAmount: totalPaidAmount[0]?.total || 0,
          pendingPayments,
        },
        categoryBreakdown,
        monthlyTrend,
        userStats: {
          total: totalUsers,
          byRole: userStats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all requests in the company (admin view)
 * @route   GET /api/admin/all-requests
 * @access  Private — admin only
 */
const getAllRequests = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = { companyId: req.user.companyId };

    if (status) query.status = status;
    if (category) query.category = category;

    const requests = await Request.find(query)
      .populate('employeeId', 'name email role')
      .populate('companyId', 'name baseCurrency')
      .populate('approvers.userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
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

/**
 * @desc    Create a new user in the admin's company
 * @route   POST /api/admin/users
 * @access  Private — admin only
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      companyId: req.user.companyId,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing user's role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private — admin only
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this user' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set the company-wide approval rule
 * @route   PUT /api/admin/settings/approval-rule
 * @access  Private — admin only
 */
const setCompanyApprovalRule = async (req, res, next) => {
  try {
    const { type, percentage, requiredRole } = req.body;

    if (!['sequential', 'percentage', 'role', 'hybrid'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid rule type' });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
       return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company.approvalRule = { type, percentage, requiredRole };
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Approval rule configured globally',
      data: company.approvalRule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin forces approval or rejection unconditionally
 * @route   PUT /api/admin/override/:requestId
 * @access  Private — admin only
 */
const overrideRequestApproval = async (req, res, next) => {
  try {
    const { action, comment } = req.body;
    const request = await Request.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this company' });
    }
    
    if (request.status === 'approved' || request.status === 'rejected') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // Admins bypass normal currentStep mapping and force the end state manually
    request.status = action === 'approved' ? 'approved' : 'rejected';
    if(action === 'rejected') {
       request.rejectedBy = req.user._id;
       request.rejectionReason = comment || 'Admin Override';
    }

    await Approval.create({
      requestId: request._id,
      approverId: req.user._id,
      role: 'admin',
      step: 99, // denote override
      action: action,
      comment: (comment ? 'ADMIN OVERRIDE: ' + comment : 'ADMIN OVERRIDE'),
      ruleMet: true,
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: `Request has been forcefully ${action} by Admin`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getUsers, 
  getAnalytics, 
  getAllRequests,
  createUser,
  updateUserRole,
  setCompanyApprovalRule,
  overrideRequestApproval
};
