/**
 * Role Authorization Middleware
 * Restricts access to routes based on user roles.
 * Must be used AFTER authMiddleware (protect) so that req.user is available.
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route
 * @returns {function} Express middleware function
 *
 * Usage:
 *   router.get('/admin-only', protect, authorizeRoles('admin'), handler);
 *   router.get('/approvers', protect, authorizeRoles('manager', 'director'), handler);
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by authMiddleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — role '${req.user.role}' is not authorized for this action`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
