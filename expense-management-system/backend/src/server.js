const express = require('express');
const cors = require('cors');
const path = require('path');
const { port, env } = require('./config/env');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// ─── Import Route Modules ────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');

// Connect to Database
connectDB();

// Initialize App
const app = express();

// ─── Global Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded receipt files as static assets
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// ─── Primary API Routes (as per spec) ────────────────────────────────
app.use('/api/auth', authRoutes);         // POST /login, /register
app.use('/api/request', requestRoutes);   // POST /create, GET /my, /all, PUT /approve/:id, /reject/:id
app.use('/api/admin', adminRoutes);       // GET /users, /analytics, /all-requests

// ─── Extended API Routes ─────────────────────────────────────────────
app.use('/api/approvals', approvalRoutes);   // Audit trail: GET /history/:requestId
app.use('/api/payments', paymentRoutes);     // PUT /:requestId/pay, GET /
app.use('/api/dashboard', dashboardRoutes);  // GET / (role-specific stats)
app.use('/api/upload', uploadRoutes);        // POST /receipt (OCR)
app.use('/api/users', userRoutes);           // Admin CRUD for users

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend Server is running.' });
});

// ─── Global Error Handler (must be AFTER routes) ─────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server running in ${env} mode on port ${port}`);
});
