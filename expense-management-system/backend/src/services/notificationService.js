/**
 * Notification Service
 * Handles sending notifications to users when actions occur in the workflow.
 *
 * Currently implements in-memory console logging.
 * Can be extended to support:
 *   - Email (nodemailer / SendGrid)
 *   - Push notifications
 *   - WebSocket real-time alerts
 *   - Slack / Teams webhooks
 */

/**
 * Notify a user about a specific event.
 * @param {Object} options
 * @param {string} options.recipientId  - User ID to notify
 * @param {string} options.recipientEmail - Email address
 * @param {string} options.type         - Notification type
 * @param {string} options.message      - Human-readable message
 * @param {Object} [options.data]       - Additional payload
 */
const sendNotification = async ({ recipientId, recipientEmail, type, message, data }) => {
  // ─── Console log for development ─────────────────────────────────
  console.log(`[NOTIFICATION] To: ${recipientEmail || recipientId}`);
  console.log(`  Type:    ${type}`);
  console.log(`  Message: ${message}`);
  if (data) console.log(`  Data:    ${JSON.stringify(data)}`);

  // TODO: Integrate email service (e.g. nodemailer)
  // await sendEmail({ to: recipientEmail, subject: type, body: message });

  return { sent: true, type, recipientId };
};

/**
 * Pre-built notification templates for common workflow events.
 */
const notifyRequestSubmitted = async (request, employee) => {
  return sendNotification({
    recipientId: employee._id,
    recipientEmail: employee.email,
    type: 'REQUEST_SUBMITTED',
    message: `Your expense request for ${request.amount} (${request.category}) has been submitted.`,
    data: { requestId: request._id },
  });
};

const notifyApprovalNeeded = async (request, approver) => {
  return sendNotification({
    recipientId: approver._id || approver.userId,
    recipientEmail: approver.email,
    type: 'APPROVAL_NEEDED',
    message: `An expense request of ${request.amount} (${request.category}) is waiting for your approval.`,
    data: { requestId: request._id, level: request.approvalLevel },
  });
};

const notifyRequestApproved = async (request, employee) => {
  return sendNotification({
    recipientId: employee._id,
    recipientEmail: employee.email,
    type: 'REQUEST_APPROVED',
    message: `Your expense request for ${request.amount} has been fully approved!`,
    data: { requestId: request._id },
  });
};

const notifyRequestRejected = async (request, employee, comment) => {
  return sendNotification({
    recipientId: employee._id,
    recipientEmail: employee.email,
    type: 'REQUEST_REJECTED',
    message: `Your expense request for ${request.amount} has been rejected. Reason: ${comment || 'No comment'}`,
    data: { requestId: request._id },
  });
};

const notifyPaymentProcessed = async (request, employee, transactionId) => {
  return sendNotification({
    recipientId: employee._id,
    recipientEmail: employee.email,
    type: 'PAYMENT_PROCESSED',
    message: `Payment of ${request.amount} has been processed. Transaction ID: ${transactionId || 'N/A'}`,
    data: { requestId: request._id, transactionId },
  });
};

module.exports = {
  sendNotification,
  notifyRequestSubmitted,
  notifyApprovalNeeded,
  notifyRequestApproved,
  notifyRequestRejected,
  notifyPaymentProcessed,
};
