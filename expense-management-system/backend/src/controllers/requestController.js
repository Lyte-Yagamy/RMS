const Request = require('../models/Request');
const Approval = require('../models/Approval');
const User = require('../models/User');
const { assignApprovers } = require('../services/workflowService');
const {
  notifyRequestSubmitted,
  notifyApprovalNeeded,
  notifyRequestApproved,
  notifyRequestRejected,
} = require('../services/notificationService');

/**
 * Role-to-level mapping for the approval chain.
 * Manager = Level 1, Finance = Level 2, Director = Level 3
 */
const ROLE_LEVEL_MAP = {
  manager: 1,
  finance: 2,
  director: 3,
};

// ═══════════════════════════════════════════════════════════════════════
//  REQUEST CRUD
// ═══════════════════════════════════════════════════════════════════════

/**
 * @desc    Create a new expense request
 * @route   POST /api/request/create
 * @access  Private — employee
 */
const createRequest = async (req, res, next) => {
  try {
    const { amount, category, description, expenseDate, receiptUrl } = req.body;

    if (!amount || !category || !description || !expenseDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount, category, description, and expenseDate',
      });
    }

    let request = await Request.create({
      employeeId: req.user._id,
      companyId: req.user.companyId,
      amount,
      category,
      description,
      expenseDate,
      receiptUrl: receiptUrl || null,
      status: 'pending',
      approvalLevel: 0,
      approvers: [],
    });

    // Auto-assign approvers via workflow service
    request = await assignApprovers(request);

    // Notify employee that request was submitted
    await notifyRequestSubmitted(request, req.user);

    // Notify first approver (manager) if assigned
    if (request.approvers.length > 0) {
      const firstApprover = await User.findById(request.approvers[0].userId);
      if (firstApprover) await notifyApprovalNeeded(request, firstApprover);
    }

    res.status(201).json({
      success: true,
      message: 'Expense request created successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all requests for the logged-in employee
 * @route   GET /api/request/my
 * @access  Private — any authenticated user
 */
const getMyRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { employeeId: req.user._id };

    if (status) query.status = status;

    const requests = await Request.find(query)
      .populate('employeeId', 'name email role')
      .populate('companyId', 'name baseCurrency')
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
 * @desc    Get all requests (based on role)
 * @route   GET /api/request/all
 * @access  Private — manager, finance, director, admin
 *
 * - Admin/Finance:  All company requests
 * - Manager/Director: Requests pending at their approval level
 */
const getAllRequests = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = { companyId: req.user.companyId };

    // If manager/director, default to showing requests at their level
    if (['manager', 'finance', 'director'].includes(req.user.role)) {
      const requiredLevel = ROLE_LEVEL_MAP[req.user.role];
      if (!status) {
        query.status = 'pending';
        query.approvalLevel = requiredLevel - 1;
      } else {
        query.status = status;
      }
    } else {
      // Admin sees everything with optional filters
      if (status) query.status = status;
    }

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

// ═══════════════════════════════════════════════════════════════════════
//  APPROVAL / REJECTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * @desc    Approve a request at the current user's level
 * @route   PUT /api/request/approve/:id
 * @access  Private — manager, finance, director
 *
 * Body (optional): { comment: '...' }
 *
 * Workflow:
 *   Manager approves  → level 1, moves to finance
 *   Finance approves  → level 2, moves to director
 *   Director approves → level 3, status = 'approved'
 */
const approveRequest = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const userRole = req.user.role;
    const requiredLevel = ROLE_LEVEL_MAP[userRole];

    if (!requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Your role does not have approval privileges',
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Ensure same company
    if (request.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this company' });
    }

    // Must still be pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Must be at the correct level
    if (request.approvalLevel !== requiredLevel - 1) {
      return res.status(400).json({
        success: false,
        message: `This request is not at your approval level. Current: ${request.approvalLevel}, yours: ${requiredLevel}`,
      });
    }

    // Prevent self-approval
    if (request.employeeId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot approve your own request',
      });
    }

    // Record in audit trail
    await Approval.create({
      requestId: request._id,
      approverId: req.user._id,
      approverRole: userRole,
      level: requiredLevel,
      action: 'approved',
      comment: comment || '',
    });

    // Update approvers array on request
    request.approvers.push({
      userId: req.user._id,
      role: userRole,
      status: 'approved',
      comment: comment || '',
      actionDate: new Date(),
    });

    // Advance level
    request.approvalLevel = requiredLevel;

    // If director approved (level 3), mark fully approved
    if (requiredLevel >= 3) {
      request.status = 'approved';
    }

    await request.save();

    // Notifications
    const employee = await User.findById(request.employeeId);

    if (request.status === 'approved' && employee) {
      await notifyRequestApproved(request, employee);
    } else {
      // Notify next approver
      const LEVEL_ROLE_MAP = { 1: 'finance', 2: 'director' };
      const nextRole = LEVEL_ROLE_MAP[requiredLevel];
      if (nextRole) {
        const nextApprover = await User.findOne({
          companyId: req.user.companyId,
          role: nextRole,
        });
        if (nextApprover) await notifyApprovalNeeded(request, nextApprover);
      }
    }

    res.status(200).json({
      success: true,
      message: request.status === 'approved'
        ? 'Request fully approved — ready for payment'
        : `Request approved at level ${requiredLevel} — forwarded to next approver`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a request
 * @route   PUT /api/request/reject/:id
 * @access  Private — manager, finance, director
 *
 * Body (optional): { comment: 'Reason for rejection' }
 *
 * Any rejection at any level immediately sets status = 'rejected'
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const userRole = req.user.role;
    const requiredLevel = ROLE_LEVEL_MAP[userRole];

    if (!requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Your role does not have rejection privileges',
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this company' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    if (request.approvalLevel !== requiredLevel - 1) {
      return res.status(400).json({
        success: false,
        message: `This request is not at your approval level. Current: ${request.approvalLevel}, yours: ${requiredLevel}`,
      });
    }

    // Record in audit trail
    await Approval.create({
      requestId: request._id,
      approverId: req.user._id,
      approverRole: userRole,
      level: requiredLevel,
      action: 'rejected',
      comment: comment || '',
    });

    // Update request
    request.approvers.push({
      userId: req.user._id,
      role: userRole,
      status: 'rejected',
      comment: comment || '',
      actionDate: new Date(),
    });

    request.status = 'rejected';
    await request.save();

    // Notify employee
    const employee = await User.findById(request.employeeId);
    if (employee) await notifyRequestRejected(request, employee, comment);

    res.status(200).json({
      success: true,
      message: `Request rejected by ${userRole}`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
};
