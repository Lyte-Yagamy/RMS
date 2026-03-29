const User = require('../models/User');

/**
 * Admin User Management Controller
 * Allows admins to create, list, update, and remove users within their company.
 * All operations are scoped to the admin's companyId.
 */

/**
 * @desc    Create a new user within the admin's company
 * @route   POST /api/users
 * @access  Private — admin only
 *
 * Body: { name, email, password, role, managerId? }
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, managerId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    // Prevent creating another admin (only one admin per company)
    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create another admin user. Only one admin per company is allowed.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Validate managerId if provided
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid managerId — manager must belong to the same company',
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password, // Hashed by pre-save hook
      role,
      companyId: req.user.companyId,
      managerId: managerId || null,
    });

    res.status(201).json({
      success: true,
      message: `User '${user.name}' created with role '${user.role}'`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        managerId: user.managerId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users in the admin's company
 * @route   GET /api/users
 * @access  Private — admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = { companyId: req.user.companyId };

    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
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
 * @desc    Get a single user by ID
 * @route   GET /api/users/:id
 * @access  Private — admin only
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'name email')
      .populate('companyId', 'name country baseCurrency');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure admin can only view users in their company
    if (user.companyId._id.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this user' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user's role or manager
 * @route   PUT /api/users/:id
 * @access  Private — admin only
 *
 * Body: { name?, role?, managerId? }
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }

    // Prevent changing own role (admin can't demote themselves)
    if (user._id.toString() === req.user._id.toString() && req.body.role) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot change their own role',
      });
    }

    const allowedFields = ['name', 'role', 'managerId'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user from the company
 * @route   DELETE /api/users/:id
 * @access  Private — admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `User '${user.name}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
