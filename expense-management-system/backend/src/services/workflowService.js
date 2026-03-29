const Request = require('../models/Request');
const User = require('../models/User');

/**
 * Workflow Service
 * Manages the automatic assignment of approvers to a request
 * based on the company's approval chain.
 *
 * Default chain: Manager (Level 1) → Finance (Level 2) → Director (Level 3)
 */

/**
 * Assign approvers to a newly created request.
 * Finds users with the required roles within the same company
 * and populates the request's approvers array.
 *
 * @param {Object} request - Mongoose Request document
 * @returns {Object} Updated request with assigned approvers
 */
const assignApprovers = async (request) => {
  const companyId = request.companyId;
  const employee = await User.findById(request.employeeId);

  const approverChain = [];

  // ─── Level 1: Manager ──────────────────────────────────────────────
  // Prefer the employee's direct manager if set, otherwise find any manager
  let manager = null;
  if (employee && employee.managerId) {
    manager = await User.findById(employee.managerId);
  }
  if (!manager) {
    manager = await User.findOne({ companyId, role: 'manager' });
  }
  if (manager) {
    approverChain.push({
      userId: manager._id,
      role: 'manager',
      status: 'pending',
      comment: '',
    });
  }

  // ─── Level 2: Finance ──────────────────────────────────────────────
  const financeUser = await User.findOne({ companyId, role: 'finance' });
  if (financeUser) {
    approverChain.push({
      userId: financeUser._id,
      role: 'finance',
      status: 'pending',
      comment: '',
    });
  }

  // ─── Level 3: Director ─────────────────────────────────────────────
  const director = await User.findOne({ companyId, role: 'director' });
  if (director) {
    approverChain.push({
      userId: director._id,
      role: 'director',
      status: 'pending',
      comment: '',
    });
  }

  // Update the request with the assigned chain
  request.approvers = approverChain;
  await request.save();

  return request;
};

/**
 * Get the next approver in the chain for a given request.
 * @param {Object} request - Mongoose Request document
 * @returns {Object|null} Next approver sub-document or null if fully approved
 */
const getNextApprover = (request) => {
  const nextApprover = request.approvers.find((a) => a.status === 'pending');
  return nextApprover || null;
};

/**
 * Check if all approvers have approved the request.
 * @param {Object} request - Mongoose Request document
 * @returns {boolean}
 */
const isFullyApproved = (request) => {
  return request.approvers.length > 0 &&
    request.approvers.every((a) => a.status === 'approved');
};

module.exports = { assignApprovers, getNextApprover, isFullyApproved };
