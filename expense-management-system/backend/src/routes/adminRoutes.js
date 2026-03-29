const express = require('express');
const router = express.Router();
const { getUsers, getAnalytics, getAllRequests } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/**
 * Admin Routes — mounted at /api/admin
 *
 * GET /api/admin/users          — List all company users
 * GET /api/admin/analytics      — Company-wide analytics & stats
 * GET /api/admin/all-requests   — View all company requests
 */

router.get('/users', protect, authorizeRoles('admin'), getUsers);
router.get('/analytics', protect, authorizeRoles('admin'), getAnalytics);
router.get('/all-requests', protect, authorizeRoles('admin'), getAllRequests);

module.exports = router;
