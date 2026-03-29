const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Dashboard Routes
 *
 * GET /api/dashboard — Get role-specific dashboard statistics
 */

router.get('/', protect, getDashboardStats);

module.exports = router;
