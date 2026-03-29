/**
 * Notification Service
 * Handles sending email notifications via Nodemailer when workflow events occur.
 *
 * ── Configuration ────────────────────────────────────────────────────────────
 * Set the following in your backend .env file to activate real email delivery:
 *
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your-gmail@gmail.com
 *   EMAIL_PASS=your-app-password        ← Use a Gmail "App Password", not your main password
 *   EMAIL_FROM=no-reply@your-domain.com
 *
 * If EMAIL_USER is not set, the service will fall back to console logging (safe for dev).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const nodemailer = require('nodemailer');
const { emailHost, emailPort, emailUser, emailPass, emailFrom, env } = require('../config/env');

// ─── Transport Setup ─────────────────────────────────────────────────────────

let transporter = null;

/**
 * Lazily creates and caches the Nodemailer transporter.
 * Falls back to a safe dev-mode logger if no credentials are configured.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (!emailUser || !emailPass) {
    // No credentials — return a fake transporter that just logs
    console.warn('[EMAIL] EMAIL_USER/EMAIL_PASS not set. Email notifications will be CONSOLE ONLY.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true only for port 465 (SSL), false for 587 (TLS)
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter;
};

// ─── Core Send Function ───────────────────────────────────────────────────────

/**
 * Send an email notification. Falls back to console logging in development
 * or if no SMTP credentials are configured.
 *
 * @param {Object} options
 * @param {string} options.recipientEmail  - Recipient email address
 * @param {string} options.subject         - Email subject line
 * @param {string} options.htmlBody        - HTML email body
 * @param {string} [options.textBody]      - Plaintext fallback body
 */
const sendEmail = async ({ recipientEmail, subject, htmlBody, textBody }) => {
  const transport = getTransporter();

  if (!transport) {
    // Dev mode: log to console instead of sending
    console.log('\n──────────────────────────────────────');
    console.log(`[EMAIL - DEV MODE] Would send to: ${recipientEmail}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${textBody || 'See HTML body'}`);
    console.log('──────────────────────────────────────\n');
    return { sent: false, devMode: true };
  }

  try {
    const info = await transport.sendMail({
      from: `"Expense RMS" <${emailFrom}>`,
      to: recipientEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });
    console.log(`[EMAIL] Sent to ${recipientEmail} — Message ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    // Never crash the whole request just because an email failed
    console.error(`[EMAIL] Failed to send to ${recipientEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
};

// ─── HTML Template Helper ─────────────────────────────────────────────────────

const buildEmailHtml = (title, bodyContent) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: #fff; padding: 24px 32px; }
        .header h1 { margin: 0; font-size: 20px; }
        .body { padding: 24px 32px; color: #374151; line-height: 1.6; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-approved { background: #d1fae5; color: #065f46; }
        .badge-rejected { background: #fee2e2; color: #991b1b; }
        .detail-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0; }
        .footer { text-align: center; padding: 16px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>📊 Expense RMS — ${title}</h1></div>
        <div class="body">${bodyContent}</div>
        <div class="footer">This is an automated message from Expense RMS. Please do not reply.</div>
      </div>
    </body>
  </html>
`;

// ─── Notification Templates ───────────────────────────────────────────────────

/**
 * Notify employee that their request was successfully submitted.
 */
const notifyRequestSubmitted = async (request, employee) => {
  return sendEmail({
    recipientEmail: employee.email,
    subject: `✅ Request Submitted — ${request.category} ($${request.amount})`,
    textBody: `Hi ${employee.name},\n\nYour expense request for $${request.amount} (${request.category}) has been submitted and is now awaiting manager approval.\n\nDescription: ${request.description}`,
    htmlBody: buildEmailHtml('Request Submitted', `
      <p>Hi <strong>${employee.name}</strong>,</p>
      <p>Your expense request has been <strong>successfully submitted</strong> and is now awaiting approval.</p>
      <div class="detail-box">
        <p><strong>Category:</strong> ${request.category}</p>
        <p><strong>Amount:</strong> $${request.amount}</p>
        <p><strong>Description:</strong> ${request.description}</p>
        <p><strong>Status:</strong> <span class="badge badge-pending">Pending Approval</span></p>
      </div>
      <p>You will be notified when your manager reviews this request.</p>
    `),
  });
};

/**
 * Notify an approver that a request is waiting for their action.
 */
const notifyApprovalNeeded = async (request, approver) => {
  const approverEmail = approver.email;
  const approverName = approver.name || 'Approver';
  return sendEmail({
    recipientEmail: approverEmail,
    subject: `🔔 Action Required — Expense Request Awaiting Your Approval ($${request.amount})`,
    textBody: `Hi ${approverName},\n\nAn expense request of $${request.amount} (${request.category}) requires your approval.\nDescription: ${request.description}`,
    htmlBody: buildEmailHtml('Approval Required', `
      <p>Hi <strong>${approverName}</strong>,</p>
      <p>An expense request is <strong>waiting for your review</strong> at your approval level.</p>
      <div class="detail-box">
        <p><strong>Category:</strong> ${request.category}</p>
        <p><strong>Amount:</strong> $${request.amount}</p>
        <p><strong>Description:</strong> ${request.description}</p>
      </div>
      <p>Please log in to the Expense RMS to approve or reject this request.</p>
    `),
  });
};

/**
 * Notify employee that their request has been fully approved.
 */
const notifyRequestApproved = async (request, employee) => {
  return sendEmail({
    recipientEmail: employee.email,
    subject: `🎉 Request Approved — $${request.amount} Reimbursement Approved!`,
    textBody: `Hi ${employee.name},\n\nGreat news! Your expense request for $${request.amount} (${request.category}) has been fully approved and will be processed for payment.`,
    htmlBody: buildEmailHtml('Request Fully Approved', `
      <p>Hi <strong>${employee.name}</strong>,</p>
      <p>Great news! Your expense request has been <strong>fully approved</strong> by all required approvers and is now being processed for payment.</p>
      <div class="detail-box">
        <p><strong>Category:</strong> ${request.category}</p>
        <p><strong>Amount:</strong> $${request.amount}</p>
        <p><strong>Status:</strong> <span class="badge badge-approved">Approved</span></p>
      </div>
    `),
  });
};

/**
 * Notify employee that their request has been rejected.
 */
const notifyRequestRejected = async (request, employee, comment) => {
  return sendEmail({
    recipientEmail: employee.email,
    subject: `❌ Request Rejected — ${request.category} ($${request.amount})`,
    textBody: `Hi ${employee.name},\n\nUnfortunately your expense request for $${request.amount} (${request.category}) has been rejected.\nReason: ${comment || 'No reason provided.'}`,
    htmlBody: buildEmailHtml('Request Rejected', `
      <p>Hi <strong>${employee.name}</strong>,</p>
      <p>Unfortunately, your expense request has been <strong>rejected</strong>.</p>
      <div class="detail-box">
        <p><strong>Category:</strong> ${request.category}</p>
        <p><strong>Amount:</strong> $${request.amount}</p>
        <p><strong>Reason:</strong> ${comment || 'No reason provided.'}</p>
        <p><strong>Status:</strong> <span class="badge badge-rejected">Rejected</span></p>
      </div>
      <p>You may submit a revised request if appropriate.</p>
    `),
  });
};

/**
 * Notify employee that their payment has been processed.
 */
const notifyPaymentProcessed = async (request, employee, transactionId) => {
  return sendEmail({
    recipientEmail: employee.email,
    subject: `💳 Payment Processed — $${request.amount} Sent!`,
    textBody: `Hi ${employee.name},\n\nYour reimbursement payment of $${request.amount} has been processed.\nTransaction ID: ${transactionId || 'N/A'}`,
    htmlBody: buildEmailHtml('Payment Processed', `
      <p>Hi <strong>${employee.name}</strong>,</p>
      <p>Your reimbursement has been <strong>successfully processed</strong>.</p>
      <div class="detail-box">
        <p><strong>Amount Paid:</strong> $${request.amount}</p>
        <p><strong>Transaction ID:</strong> ${transactionId || 'N/A'}</p>
        <p><strong>Category:</strong> ${request.category}</p>
      </div>
    `),
  });
};

module.exports = {
  sendNotification: sendEmail,
  notifyRequestSubmitted,
  notifyApprovalNeeded,
  notifyRequestApproved,
  notifyRequestRejected,
  notifyPaymentProcessed,
};
