const express = require('express');
const router = express.Router();
const {
  getPendingApprovals,
  processApproval,
  getApprovalHistory,
} = require('../controllers/approvalController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/**
 * Approval Routes
 *
 * GET    /api/approvals/pending            — Get requests pending for my role
 * PUT    /api/approvals/:id                — Approve or reject a request
 * GET    /api/approvals/history/:requestId — Get audit trail for a request
 */

router.get(
  '/pending',
  protect,
  authorizeRoles('manager', 'finance', 'director'),
  getPendingApprovals
);

router.put(
  '/:id',
  protect,
  authorizeRoles('manager', 'finance', 'director'),
  processApproval
);

router.get('/history/:requestId', protect, getApprovalHistory);

module.exports = router;
