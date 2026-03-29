/**
 * Role-Based Authorization Middleware
 *
 * Provides a factory function `authorizeRoles(...roles)` that returns
 * an Express middleware. The middleware checks if the authenticated user's
 * role is among the permitted roles and blocks access with a 403 if not.
 *
 * Usage:
 *   const { authorizeRoles } = require('../middleware/roleMiddleware');
 *
 *   // Single role:
 *   router.get('/admin-panel', authorizeRoles('admin'), controller.adminPanel);
 *
 *   // Multiple roles:
 *   router.put('/approve/:id', authorizeRoles('manager', 'finance', 'director'), controller.approve);
 *
 * Prerequisites:
 *   - req.user must be set by a prior auth middleware (e.g. authMiddleware.js)
 *   - req.user.role must be a string indicating the user's role
 *
 * @module middleware/roleMiddleware
 */

/**
 * Factory function that creates role-based authorization middleware.
 *
 * Accepts one or more role strings. The returned middleware checks if
 * `req.user.role` matches any of the permitted roles. Comparison is
 * case-insensitive (e.g. "Manager" matches "manager").
 *
 * @param {...string} roles - The roles allowed to access the route
 * @returns {Function} Express middleware function (req, res, next)
 *
 * @example
 *   // Only directors can access:
 *   app.get('/final-approval', authorizeRoles('director'), handler);
 *
 * @example
 *   // Manager, finance, or director can access:
 *   app.put('/approve', authorizeRoles('manager', 'finance', 'director'), handler);
 */
function authorizeRoles(...roles) {
  // Normalize permitted roles to lowercase at creation time (not on every request)
  const permittedRoles = roles.map((role) => role.toLowerCase().trim());

  return (req, res, next) => {
    // Step 1: Check if req.user exists (auth middleware should have set this)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in first.',
      });
    }

    // Step 2: Check if the user has a role assigned
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. No role assigned to your account.',
      });
    }

    // Step 3: Check if the user's role is in the permitted roles list
    const userRole = req.user.role.toLowerCase().trim();

    if (!permittedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message:
          `Access denied. Required role(s): ${permittedRoles.join(', ')}. ` +
          `Your role: ${userRole}.`,
      });
    }

    // Step 4: User is authorized — proceed to the next middleware/controller
    next();
  };
}

module.exports = { authorizeRoles };
