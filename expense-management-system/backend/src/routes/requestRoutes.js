const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/**
 * Request Routes — mounted at /api/request
 *
 * POST   /api/request/create      — Create new expense request (employee)
 * GET    /api/request/my          — Get my requests (any authenticated user)
 * GET    /api/request/all         — Get all requests (manager/finance/director/admin)
 * PUT    /api/request/approve/:id — Approve a request (manager/finance/director)
 * PUT    /api/request/reject/:id  — Reject a request (manager/finance/director)
 */

router.post('/create', protect, authorizeRoles('employee'), createRequest);
router.get('/my', protect, getMyRequests);
router.get('/all', protect, authorizeRoles('manager', 'finance', 'director', 'admin'), getAllRequests);
router.put('/approve/:id', protect, authorizeRoles('manager', 'finance', 'director'), approveRequest);
router.put('/reject/:id', protect, authorizeRoles('manager', 'finance', 'director'), rejectRequest);

module.exports = router;
