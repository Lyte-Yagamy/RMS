const express = require('express');
const router = express.Router();
const { markAsPaid, getAllPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/**
 * Payment Routes
 *
 * PUT    /api/payments/:requestId/pay  — Mark approved request as paid (finance)
 * GET    /api/payments                 — Get all payments (finance, admin)
 */

router.put(
  '/:requestId/pay',
  protect,
  authorizeRoles('finance'),
  markAsPaid
);

router.get(
  '/',
  protect,
  authorizeRoles('finance', 'admin'),
  getAllPayments
);

module.exports = router;
