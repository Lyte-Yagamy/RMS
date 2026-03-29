const User = require('../models/User');
const Request = require('../models/Request');
const Payment = require('../models/Payment');

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

module.exports = { getUsers, getAnalytics, getAllRequests };
