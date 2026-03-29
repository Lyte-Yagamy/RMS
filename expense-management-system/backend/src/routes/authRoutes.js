const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Auth Routes
 *
 * POST   /api/auth/register  — Register new company + admin user (public)
 * POST   /api/auth/login     — Login with email & password (public)
 * GET    /api/auth/me        — Get current user profile (protected)
 */

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
