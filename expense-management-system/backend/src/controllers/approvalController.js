const Request = require('../models/Request');
const Approval = require('../models/Approval');
const User = require('../models/User');
const { processApproval: workflowApproval, processRejection: workflowRejection } = require('../services/workflowService');

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
      status: { $in: ['pending', 'in_progress'] },
      currentStep: requiredLevel - 1, // Current level waiting for next approval
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

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'approved' or 'rejected'" });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this company' });
    }

    let result;
    if (action === 'approved') {
      result = await workflowApproval(request, req.user);
    } else {
      result = await workflowRejection(request, req.user, comment);
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.request,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
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
