const Request = require('../models/Request');
const User = require('../models/User');
const Payment = require('../models/Payment');

/**
 * @desc    Get dashboard statistics for the logged-in user's company
 * @route   GET /api/dashboard
 * @access  Private — all roles
 *
 * Returns role-specific data:
 *   - Admin:    full company overview
 *   - Finance:  payment summaries
 *   - Manager/Director: pending approvals count
 *   - Employee: own request summary
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user._id;
    const role = req.user.role;

    // ─── Common company-wide stats ───────────────────────────────────
    const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] =
      await Promise.all([
        Request.countDocuments({ companyId }),
        Request.countDocuments({ companyId, status: 'pending' }),
        Request.countDocuments({ companyId, status: 'approved' }),
        Request.countDocuments({ companyId, status: 'rejected' }),
      ]);

    // Total approved amount
    const totalApprovedAmount = await Request.aggregate([
      { $match: { companyId: req.user.companyId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Total paid amount
    const totalPaidAmount = await Payment.aggregate([
      { $match: { companyId: req.user.companyId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Category breakdown
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

    const stats = {
      overview: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
        totalPaidAmount: totalPaidAmount[0]?.total || 0,
      },
      categoryBreakdown,
    };

    // ─── Role-specific additions ─────────────────────────────────────
    if (role === 'employee') {
      const myRequests = await Request.countDocuments({ employeeId: userId });
      const myPending = await Request.countDocuments({ employeeId: userId, status: 'pending' });
      const myApproved = await Request.countDocuments({ employeeId: userId, status: 'approved' });
      const myRejected = await Request.countDocuments({ employeeId: userId, status: 'rejected' });

      stats.myStats = {
        totalRequests: myRequests,
        pending: myPending,
        approved: myApproved,
        rejected: myRejected,
      };
    }

    if (['manager', 'finance', 'director'].includes(role)) {
      const ROLE_LEVEL_MAP = { manager: 1, finance: 2, director: 3 };
      const myLevel = ROLE_LEVEL_MAP[role];

      const pendingForMe = await Request.countDocuments({
        companyId,
        status: 'pending',
        approvalLevel: myLevel - 1,
      });

      stats.pendingForMyApproval = pendingForMe;
    }

    if (role === 'admin') {
      const totalUsers = await User.countDocuments({ companyId });
      const pendingPayments = await Request.countDocuments({
        companyId,
        status: 'approved',
        paymentStatus: 'pending',
      });

      stats.adminStats = { totalUsers, pendingPayments };
    }

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
