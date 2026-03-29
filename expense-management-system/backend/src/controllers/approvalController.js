const Request = require('../models/Request');
const Approval = require('../models/Approval');
const User = require('../models/User');
const {
  notifyRequestApproved,
  notifyRequestRejected,
  notifyApprovalNeeded,
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

/**
 * @desc    Get all requests pending approval for the current user's role
 * @route   GET /api/approvals/pending
 * @access  Private — manager, finance, director
 */
const getPendingApprovals = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const requiredLevel = ROLE_LEVEL_MAP[userRole];

    if (!requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Your role does not have approval privileges',
      });
    }

    // Fetch requests at the level that matches this approver's role
    // A request at approvalLevel 0 needs level 1 (manager), etc.
    const requests = await Request.find({
      companyId: req.user.companyId,
      status: 'pending',
      approvalLevel: requiredLevel - 1, // Current level waiting for next approval
    })
      .populate('employeeId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject a request
 * @route   PUT /api/approvals/:id
 * @access  Private — manager, finance, director
 *
 * Body: { action: 'approved' | 'rejected', comment: '...' }
 *
 * Workflow:
 *   - Manager approves  → approvalLevel becomes 1, moves to finance
 *   - Finance approves  → approvalLevel becomes 2, moves to director
 *   - Director approves → approvalLevel becomes 3, status = 'approved'
 *   - Any role rejects  → status = 'rejected' immediately
 */
const processApproval = async (req, res, next) => {
  try {
    const { action, comment } = req.body;
    const userRole = req.user.role;
    const requiredLevel = ROLE_LEVEL_MAP[userRole];

    // Validate action
    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'approved' or 'rejected'",
      });
    }

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

    // Ensure request belongs to the same company
    if (request.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this company' });
    }

    // Check that request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Check that request is at the correct level for this role
    if (request.approvalLevel !== requiredLevel - 1) {
      return res.status(400).json({
        success: false,
        message: `This request is not at your approval level. Current level: ${request.approvalLevel}, your level: ${requiredLevel}`,
      });
    }

    // Prevent self-approval (employee cannot approve their own request)
    if (request.employeeId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot approve your own request',
      });
    }

    // ─── Record the approval action in the audit trail ───────────────
    await Approval.create({
      requestId: request._id,
      approverId: req.user._id,
      role: userRole,
      step: requiredLevel,
      action,
      comment: comment || '',
    });

    // ─── Update the approvers array on the request ───────────────────
    request.approvers.push({
      userId: req.user._id,
      role: userRole,
      status: action,
      comment: comment || '',
      actionDate: new Date(),
    });

    // ─── Process the action ──────────────────────────────────────────
    if (action === 'rejected') {
      // Any rejection immediately rejects the whole request
      request.status = 'rejected';
    } else {
      // Advance to next level
      request.approvalLevel = requiredLevel;

      // If director (level 3) approved, mark as fully approved
      if (requiredLevel >= 3) {
        request.status = 'approved';
      }
    }

    await request.save();

    // ─── Send notifications ──────────────────────────────────────────
    const employee = await User.findById(request.employeeId);

    if (action === 'rejected' && employee) {
      await notifyRequestRejected(request, employee, comment);
    } else if (request.status === 'approved' && employee) {
      await notifyRequestApproved(request, employee);
    } else {
      // Notify next approver in the chain
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
      message: action === 'approved'
        ? `Request ${request.status === 'approved' ? 'fully approved' : 'approved at level ' + requiredLevel}`
        : 'Request rejected',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get approval history / audit trail for a specific request
 * @route   GET /api/approvals/history/:requestId
 * @access  Private — any authenticated user in the same company
 */
const getApprovalHistory = async (req, res, next) => {
  try {
    const approvals = await Approval.find({ requestId: req.params.requestId })
      .populate('approverId', 'name email role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: approvals.length,
      data: approvals,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPendingApprovals, processApproval, getApprovalHistory };
