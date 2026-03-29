const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getAnalytics, 
  getAllRequests,
  createUser,
  updateUserRole,
  setCompanyApprovalRule,
  overrideRequestApproval
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/**
 * Admin Routes — mounted at /api/admin
 *
 * GET /api/admin/users          — List all company users
 * POST /api/admin/users         — Create user
 * PUT /api/admin/users/:id/role — Change user role
 * GET /api/admin/analytics      — Company-wide analytics
 * GET /api/admin/all-requests   — View all company requests
 * PUT /api/admin/settings/approval-rule - Set global approval configuration
 * PUT /api/admin/override/:requestId  - Unconditional Admin approval
 */

router.get('/users', protect, authorizeRoles('admin'), getUsers);
router.post('/users', protect, authorizeRoles('admin'), createUser);
router.put('/users/:id/role', protect, authorizeRoles('admin'), updateUserRole);

router.get('/analytics', protect, authorizeRoles('admin'), getAnalytics);
router.get('/all-requests', protect, authorizeRoles('admin'), getAllRequests);

router.put('/settings/approval-rule', protect, authorizeRoles('admin'), setCompanyApprovalRule);
router.put('/override/:requestId', protect, authorizeRoles('admin'), overrideRequestApproval);

module.exports = router;
