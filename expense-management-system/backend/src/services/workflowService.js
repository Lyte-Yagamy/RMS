/**
 * Workflow Service — Core Approval Engine
 *
 * This is the central logic engine for the expense reimbursement approval system.
 * It manages multi-level dynamic approval flows with support for four rule types:
 *
 *   1. Sequential  — Every approver must approve in order (default)
 *   2. Percentage   — X% of approvers must approve (can short-circuit the chain)
 *   3. Role-based   — A specific role (e.g. Director) must be among the approvers who approved
 *   4. Hybrid       — Both percentage AND role conditions must be satisfied
 *
 * Each request carries its own approval chain:
 *   - request.approvers[]   — Array of { userId, role, status, comment, actedAt }
 *   - request.currentStep   — Index pointing to the current approver in the array
 *   - request.approvalRule  — { type, percentage, requiredRole }
 *
 * Main Functions:
 *   - processApproval(request, user)           — Approve and advance the chain
 *   - processRejection(request, user, comment) — Reject and halt the chain
 *   - evaluateApprovalRule(request)            — Check if approval conditions are met
 *
 * @module services/workflowService
 */

const Approval = require('../models/Approval');

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

/**
 * Valid request statuses throughout the workflow lifecycle.
 */
const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/**
 * Valid approval rule types that determine how approval is evaluated.
 */
const RULE_TYPES = {
  SEQUENTIAL: 'sequential',
  PERCENTAGE: 'percentage',
  ROLE: 'role',
  HYBRID: 'hybrid',
};

/**
 * Valid actions an approver can take.
 */
const ACTIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/**
 * Approver-level statuses within the approvers array.
 */
const APPROVER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// ─── MAIN FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Process an approval action on a reimbursement request.
 *
 * This function:
 *   1. Validates the request is in an actionable state
 *   2. Verifies the user is the current approver
 *   3. Marks the current approver as "approved"
 *   4. Evaluates the approval rule to check if the request is fully approved
 *   5. Advances to the next step or marks the request as approved
 *   6. Creates an immutable audit trail record
 *   7. Saves the request and returns the updated state
 *
 * @param {Object} request - The Mongoose request document (must have approvers[], currentStep, approvalRule)
 * @param {Object} user    - The authenticated user object (must have _id and role)
 * @returns {Object} Result object with { success, message, request, auditRecord, ruleMet }
 * @throws {Error} If request is not actionable, or user is not the current approver
 *
 * @example
 *   const result = await processApproval(request, user);
 *   // result.success === true
 *   // result.message === "Request approved. Moved to next approver (Finance)."
 *   // result.ruleMet === false (more approvers needed)
 */
async function processApproval(request, user) {
  // Step 1: Validate the request can still be acted upon
  _validateRequestIsActionable(request);

  // Step 2: Validate the user is the current approver
  const currentApprover = _validateApproverAuthority(request, user);

  // Step 3: Mark the current approver as approved
  currentApprover.status = APPROVER_STATUS.APPROVED;
  currentApprover.actedAt = new Date();

  // Step 4: Evaluate the approval rule
  const ruleMet = evaluateApprovalRule(request);

  // Step 5: Determine next state
  let message;

  if (ruleMet) {
    // Rule is satisfied — request is fully approved
    request.status = STATUS.APPROVED;
    message = 'Request has been fully approved.';
  } else if (_hasMoreSteps(request)) {
    // More approvers to go — advance to next step
    request.currentStep += 1;
    request.status = STATUS.IN_PROGRESS;

    const nextApprover = request.approvers[request.currentStep];
    message = `Request approved. Moved to next approver (${_capitalize(nextApprover.role)}).`;
  } else {
    // No more steps and rule not explicitly met — all have approved sequentially
    request.status = STATUS.APPROVED;
    message = 'Request has been fully approved (all approvers completed).';
  }

  // Step 6: Create an immutable audit trail record
  const auditRecord = await _createAuditRecord({
    requestId: request._id,
    approverId: user._id,
    step: request.currentStep - (ruleMet || !_hasMoreSteps(request) ? 0 : 1),
    role: currentApprover.role,
    action: ACTIONS.APPROVED,
    comment: '',
    ruleMet: ruleMet,
  });

  // Step 7: Save the updated request
  await request.save();

  return {
    success: true,
    message,
    request,
    auditRecord,
    ruleMet,
  };
}

/**
 * Process a rejection action on a reimbursement request.
 *
 * This function:
 *   1. Validates the request is in an actionable state
 *   2. Verifies the user is the current approver
 *   3. Marks the current approver as "rejected" with a comment
 *   4. Sets the entire request status to "rejected"
 *   5. Stores who rejected and why
 *   6. Creates an immutable audit trail record
 *   7. Saves the request and returns the updated state
 *
 * Rejection is final — it halts the entire approval chain immediately.
 *
 * @param {Object} request - The Mongoose request document
 * @param {Object} user    - The authenticated user object (must have _id and role)
 * @param {string} comment - The reason for rejection (required for rejections)
 * @returns {Object} Result object with { success, message, request, auditRecord }
 * @throws {Error} If request is not actionable, user is not the current approver, or comment is missing
 *
 * @example
 *   const result = await processRejection(request, user, "Receipt is unclear.");
 *   // result.success === true
 *   // result.request.status === "rejected"
 */
async function processRejection(request, user, comment) {
  // Step 1: Validate comment is provided
  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    const error = new Error('A comment is required when rejecting a request.');
    error.statusCode = 400;
    throw error;
  }

  // Step 2: Validate the request can still be acted upon
  _validateRequestIsActionable(request);

  // Step 3: Validate the user is the current approver
  const currentApprover = _validateApproverAuthority(request, user);

  // Step 4: Mark the current approver as rejected
  currentApprover.status = APPROVER_STATUS.REJECTED;
  currentApprover.comment = comment.trim();
  currentApprover.actedAt = new Date();

  // Step 5: Set the request status to rejected
  request.status = STATUS.REJECTED;
  request.rejectedBy = user._id;
  request.rejectionReason = comment.trim();

  // Step 6: Create an immutable audit trail record
  const auditRecord = await _createAuditRecord({
    requestId: request._id,
    approverId: user._id,
    step: request.currentStep,
    role: currentApprover.role,
    action: ACTIONS.REJECTED,
    comment: comment.trim(),
    ruleMet: false,
  });

  // Step 7: Save the updated request
  await request.save();

  return {
    success: true,
    message: `Request has been rejected by ${_capitalize(currentApprover.role)}.`,
    request,
    auditRecord,
  };
}

/**
 * Evaluate the approval rule for a request to determine if the
 * approval conditions have been fully satisfied.
 *
 * Supports four rule types:
 *
 *   "sequential"  — Returns true only when the LAST approver in the chain
 *                    has approved (all must approve in order).
 *
 *   "percentage"  — Returns true when the percentage of approved approvers
 *                    meets or exceeds the threshold (e.g. 60%).
 *                    This can short-circuit the chain — if 2 out of 3 approvers
 *                    have approved and the rule is 60%, the 3rd is not needed.
 *
 *   "role"        — Returns true when an approver with the specified role
 *                    (e.g. "director") has approved. Other approvals alone
 *                    are not sufficient.
 *
 *   "hybrid"      — Returns true only when BOTH conditions are met:
 *                    the percentage threshold is reached AND the required
 *                    role has approved.
 *
 * @param {Object} request - The request document with approvers[] and approvalRule
 * @returns {boolean} True if the approval rule is satisfied, false otherwise
 *
 * @example
 *   // Percentage rule: 60% of 3 approvers = need 2
 *   request.approvalRule = { type: "percentage", percentage: 60 };
 *   // After 2 approvals: evaluateApprovalRule(request) → true
 *
 * @example
 *   // Role rule: Director must approve
 *   request.approvalRule = { type: "role", requiredRole: "director" };
 *   // After manager approves: evaluateApprovalRule(request) → false
 *   // After director approves: evaluateApprovalRule(request) → true
 *
 * @example
 *   // Hybrid rule: 60% + Director
 *   request.approvalRule = { type: "hybrid", percentage: 60, requiredRole: "director" };
 *   // Need both conditions met simultaneously
 */
function evaluateApprovalRule(request) {
  const { approvers, approvalRule } = request;

  // Default to sequential if no rule is specified
  const ruleType = (approvalRule && approvalRule.type) || RULE_TYPES.SEQUENTIAL;

  switch (ruleType) {
    case RULE_TYPES.SEQUENTIAL:
      return _evaluateSequentialRule(approvers, request.currentStep);

    case RULE_TYPES.PERCENTAGE:
      return _evaluatePercentageRule(approvers, approvalRule.percentage);

    case RULE_TYPES.ROLE:
      return _evaluateRoleRule(approvers, approvalRule.requiredRole);

    case RULE_TYPES.HYBRID:
      return _evaluateHybridRule(
        approvers,
        approvalRule.percentage,
        approvalRule.requiredRole
      );

    default: {
      const error = new Error(`Unknown approval rule type: "${ruleType}"`);
      error.statusCode = 400;
      throw error;
    }
  }
}

// ─── RULE EVALUATION HELPERS ─────────────────────────────────────────────────

/**
 * Sequential Rule:
 * Returns true only when the current step is the last step in the chain,
 * meaning all approvers have had their turn and the last one just approved.
 *
 * @param {Array} approvers   - The approvers array
 * @param {number} currentStep - The current step index
 * @returns {boolean}
 */
function _evaluateSequentialRule(approvers, currentStep) {
  // Rule is met when we've reached the last approver
  return currentStep >= approvers.length - 1;
}

/**
 * Percentage Rule:
 * Returns true when the percentage of approvers who have approved
 * meets or exceeds the required threshold.
 *
 * Example: 3 approvers, 60% rule → need ceil(3 * 0.6) = 2 approvals
 *
 * @param {Array} approvers      - The approvers array
 * @param {number} percentage    - The required approval percentage (0-100)
 * @returns {boolean}
 */
function _evaluatePercentageRule(approvers, percentage) {
  // Guard: percentage must be a valid number
  if (typeof percentage !== 'number' || percentage <= 0 || percentage > 100) {
    const error = new Error(
      `Invalid percentage value: "${percentage}". Must be a number between 1 and 100.`
    );
    error.statusCode = 400;
    throw error;
  }

  const totalApprovers = approvers.length;
  const approvedCount = _countApproved(approvers);
  const approvedPercentage = (approvedCount / totalApprovers) * 100;

  return approvedPercentage >= percentage;
}

/**
 * Role Rule:
 * Returns true when at least one approver with the specified role
 * has approved. Other approvals are irrelevant for this rule.
 *
 * @param {Array} approvers      - The approvers array
 * @param {string} requiredRole  - The role that must approve (e.g. "director")
 * @returns {boolean}
 */
function _evaluateRoleRule(approvers, requiredRole) {
  // Guard: required role must be specified
  if (!requiredRole || typeof requiredRole !== 'string') {
    const error = new Error(
      'Required role must be specified for role-based approval rule.'
    );
    error.statusCode = 400;
    throw error;
  }

  return approvers.some(
    (approver) =>
      approver.role === requiredRole.toLowerCase() &&
      approver.status === APPROVER_STATUS.APPROVED
  );
}

/**
 * Hybrid Rule:
 * Returns true only when BOTH conditions are met simultaneously:
 *   1. The percentage threshold is reached
 *   2. The required role has approved
 *
 * @param {Array} approvers      - The approvers array
 * @param {number} percentage    - The required approval percentage (0-100)
 * @param {string} requiredRole  - The role that must approve
 * @returns {boolean}
 */
function _evaluateHybridRule(approvers, percentage, requiredRole) {
  const percentageMet = _evaluatePercentageRule(approvers, percentage);
  const roleMet = _evaluateRoleRule(approvers, requiredRole);

  return percentageMet && roleMet;
}

// ─── VALIDATION HELPERS ──────────────────────────────────────────────────────

/**
 * Validates that the request is in a state where actions can be taken.
 * A request can only be acted upon if its status is "pending" or "in_progress".
 *
 * @param {Object} request - The request document
 * @throws {Error} If the request has already been approved or rejected
 */
function _validateRequestIsActionable(request) {
  if (!request) {
    const error = new Error('Request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (request.status === STATUS.APPROVED) {
    const error = new Error(
      'This request has already been fully approved. No further actions can be taken.'
    );
    error.statusCode = 400;
    throw error;
  }

  if (request.status === STATUS.REJECTED) {
    const error = new Error(
      'This request has been rejected. No further actions can be taken.'
    );
    error.statusCode = 400;
    throw error;
  }

  // Ensure the approvers array exists and has entries
  if (!request.approvers || request.approvers.length === 0) {
    const error = new Error(
      'This request has no approvers defined. Cannot process approval.'
    );
    error.statusCode = 400;
    throw error;
  }

  // Ensure currentStep is within bounds
  if (request.currentStep < 0 || request.currentStep >= request.approvers.length) {
    const error = new Error(
      `Invalid currentStep (${request.currentStep}). Must be between 0 and ${request.approvers.length - 1}.`
    );
    error.statusCode = 500;
    throw error;
  }
}

/**
 * Validates that the given user is the current approver for this request.
 * Only the approver at the current step index can take action.
 *
 * @param {Object} request - The request document
 * @param {Object} user    - The authenticated user with _id
 * @returns {Object} The current approver object from the approvers array
 * @throws {Error} If the user is not the current approver
 */
function _validateApproverAuthority(request, user) {
  if (!user || !user._id) {
    const error = new Error('User information is required to process approval.');
    error.statusCode = 401;
    throw error;
  }

  const currentApprover = request.approvers[request.currentStep];

  // Compare user ID with the current approver's userId
  // Using .toString() for safe ObjectId comparison
  const userId = user._id.toString();
  const approverId = currentApprover.userId.toString();

  if (userId !== approverId) {
    const error = new Error(
      `You are not authorized to act on this request. ` +
      `Current step requires approval from the ${_capitalize(currentApprover.role)}.`
    );
    error.statusCode = 403;
    throw error;
  }

  // Double-check the approver hasn't already acted
  if (currentApprover.status !== APPROVER_STATUS.PENDING) {
    const error = new Error(
      `This step has already been processed (${currentApprover.status}).`
    );
    error.statusCode = 400;
    throw error;
  }

  return currentApprover;
}

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────

/**
 * Check if there are more steps remaining after the current one.
 *
 * @param {Object} request - The request document
 * @returns {boolean} True if more approvers exist after currentStep
 */
function _hasMoreSteps(request) {
  return request.currentStep < request.approvers.length - 1;
}

/**
 * Count how many approvers have approved so far.
 *
 * @param {Array} approvers - The approvers array
 * @returns {number} Count of approvers with status "approved"
 */
function _countApproved(approvers) {
  return approvers.filter(
    (approver) => approver.status === APPROVER_STATUS.APPROVED
  ).length;
}

/**
 * Capitalize the first letter of a string.
 * Used for formatting role names in messages.
 *
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
function _capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Create an immutable audit trail record in the Approval collection.
 * This record cannot be modified once created — it serves as proof
 * of every action taken in the workflow.
 *
 * @param {Object} data - Audit record data
 * @param {ObjectId} data.requestId  - The request being acted upon
 * @param {ObjectId} data.approverId - The user who took the action
 * @param {number}   data.step       - The step index
 * @param {string}   data.role       - The approver's role
 * @param {string}   data.action     - "approved" or "rejected"
 * @param {string}   data.comment    - Optional comment
 * @param {boolean}  data.ruleMet    - Whether the rule was satisfied
 * @returns {Object} The created Approval document
 */
async function _createAuditRecord(data) {
  const auditRecord = new Approval({
    requestId: data.requestId,
    approverId: data.approverId,
    step: data.step,
    role: data.role,
    action: data.action,
    comment: data.comment || '',
    ruleMet: data.ruleMet || false,
  });

  await auditRecord.save();
  return auditRecord;
}

const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Auto-assigns the 3-level approval chain to a new request.
 * Level 1: Manager, Level 2: Finance, Level 3: Director
 * 
 * @param {Object} request - The mongoose request document
 * @returns {Object} The updated request document
 */
async function assignApprovers(request) {
  // Transfer the company's rule specifically to this request so it remains immutable for this specific workflow instance
  const company = await Company.findById(request.companyId);
  if (company && company.approvalRule) {
    request.approvalRule = company.approvalRule;
  }
  // Fetch required roles for the company
  const employee = await User.findById(request.employeeId);
  const managerId = employee ? employee.managerId : null;
  
  // Try to find the specific manager, or fallback to any manager in company
  let manager = null;
  if (managerId) {
    manager = await User.findById(managerId);
  }
  if (!manager) {
    manager = await User.findOne({ companyId: request.companyId, role: 'manager' });
  }

  const finance = await User.findOne({ companyId: request.companyId, role: 'finance' });
  const director = await User.findOne({ companyId: request.companyId, role: 'director' });

  const approvers = [];

  if (manager) {
    approvers.push({ userId: manager._id, role: 'manager', status: 'pending', comment: '' });
  }
  if (finance) {
    approvers.push({ userId: finance._id, role: 'finance', status: 'pending', comment: '' });
  }
  if (director) {
    approvers.push({ userId: director._id, role: 'director', status: 'pending', comment: '' });
  }

  request.approvers = approvers;
  await request.save();
  return request;
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
  // Main functions (as specified in the prompt)
  processApproval,
  processRejection,
  evaluateApprovalRule,
  assignApprovers,

  // Constants (useful for other modules)
  STATUS,
  RULE_TYPES,
  ACTIONS,
  APPROVER_STATUS,
};
