const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/**
 * User Management Routes (Admin Only)
 *
 * POST   /api/users       — Create a new user in the company
 * GET    /api/users       — List all users in the company
 * GET    /api/users/:id   — Get a single user
 * PUT    /api/users/:id   — Update user role/manager
 * DELETE /api/users/:id   — Remove a user
 */

router.post('/', protect, authorizeRoles('admin'), createUser);
router.get('/', protect, authorizeRoles('admin'), getAllUsers);
router.get('/:id', protect, authorizeRoles('admin'), getUserById);
router.put('/:id', protect, authorizeRoles('admin'), updateUser);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;
