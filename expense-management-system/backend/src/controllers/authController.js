const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { jwtSecret, jwtExpire } = require('../config/env');

/**
 * Generate a signed JWT token for the given user ID.
 * @param {string} id - MongoDB user _id
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpire });
};

/**
 * @desc    Register a new company and its admin user
 * @route   POST /api/auth/signup
 * @access  Public
 *
 * Flow:
 *   1. Create the Company document
 *   2. Create the Admin user linked to that company
 *   3. Return JWT token for immediate login
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, companyName, country, baseCurrency } = req.body;

    // Validate required fields
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and companyName',
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Step 1: Create the Company
    const company = await Company.create({
      name: companyName,
      country: country || 'India',
      baseCurrency: baseCurrency || 'INR',
    });

    // Step 2: Create the Admin user linked to the company
    const user = await User.create({
      name,
      email,
      password, // Hashed automatically by pre-save hook
      role: 'admin',
      companyId: company._id,
      managerId: null, // Admin has no manager
    });

    // Step 3: Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Company and admin user created successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
        company: {
          id: company._id,
          name: company.name,
          country: company.country,
          baseCurrency: company.baseCurrency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Find user and explicitly include password field for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the currently logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires token)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('companyId', 'name country baseCurrency');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.companyId,
        managerId: user.managerId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, register: signup, login, getMe };
