const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load env before importing models
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./src/models/User');
const Company = require('./src/models/Company');
const Request = require('./src/models/Request');

/**
 * MongoDB Seed Script
 * Creates sample data for development and testing.
 *
 * Usage: node seed.js
 *
 * Creates:
 *   - 1 Company (Acme Corp)
 *   - 5 Users (one per role: admin, director, manager, finance, employee)
 *   - 3 Sample expense requests at varying approval levels
 */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expense_rms';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // ─── Clear existing data ─────────────────────────────────────────
    await User.deleteMany({});
    await Company.deleteMany({});
    await Request.deleteMany({});
    console.log('Cleared existing data.');

    // ─── Create Company ──────────────────────────────────────────────
    const company = await Company.create({
      name: 'Acme Corporation',
      country: 'India',
      baseCurrency: 'INR',
    });
    console.log(`Company created: ${company.name}`);

    // ─── Create Users (one per role) ─────────────────────────────────
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@acme.com',
        password: 'password123',
        role: 'admin',
        companyId: company._id,
      },
      {
        name: 'Director Singh',
        email: 'director@acme.com',
        password: 'password123',
        role: 'director',
        companyId: company._id,
      },
      {
        name: 'Manager Sharma',
        email: 'manager@acme.com',
        password: 'password123',
        role: 'manager',
        companyId: company._id,
      },
      {
        name: 'Finance Gupta',
        email: 'finance@acme.com',
        password: 'password123',
        role: 'finance',
        companyId: company._id,
      },
      {
        name: 'Employee Patel',
        email: 'employee@acme.com',
        password: 'password123',
        role: 'employee',
        companyId: company._id,
      },
    ]);

    const [admin, director, manager, finance, employee] = users;

    // Set employee's managerId to the manager
    employee.managerId = manager._id;
    await employee.save();

    console.log('Users created:');
    users.forEach((u) => console.log(`  - ${u.role}: ${u.email}`));

    // ─── Create Sample Requests ──────────────────────────────────────
    const requests = await Request.create([
      {
        employeeId: employee._id,
        companyId: company._id,
        amount: 2500,
        category: 'travel',
        description: 'Client visit to Mumbai — cab and train tickets',
        expenseDate: new Date('2026-03-15'),
        status: 'pending',
        approvalLevel: 0,
        approvers: [
          { userId: manager._id, role: 'manager', status: 'pending', comment: '' },
          { userId: finance._id, role: 'finance', status: 'pending', comment: '' },
          { userId: director._id, role: 'director', status: 'pending', comment: '' },
        ],
      },
      {
        employeeId: employee._id,
        companyId: company._id,
        amount: 850,
        category: 'meals',
        description: 'Team lunch for project kickoff',
        expenseDate: new Date('2026-03-20'),
        status: 'pending',
        approvalLevel: 1,
        approvers: [
          { userId: manager._id, role: 'manager', status: 'approved', comment: 'Looks good', actionDate: new Date() },
          { userId: finance._id, role: 'finance', status: 'pending', comment: '' },
          { userId: director._id, role: 'director', status: 'pending', comment: '' },
        ],
      },
      {
        employeeId: employee._id,
        companyId: company._id,
        amount: 15000,
        category: 'software',
        description: 'Annual JetBrains IDE license renewal',
        expenseDate: new Date('2026-03-01'),
        status: 'approved',
        approvalLevel: 3,
        paymentStatus: 'pending',
        approvers: [
          { userId: manager._id, role: 'manager', status: 'approved', comment: 'Essential tool', actionDate: new Date() },
          { userId: finance._id, role: 'finance', status: 'approved', comment: 'Budget OK', actionDate: new Date() },
          { userId: director._id, role: 'director', status: 'approved', comment: 'Approved', actionDate: new Date() },
        ],
      },
    ]);

    console.log(`\nSample requests created: ${requests.length}`);
    console.log('  - Request 1: Pending (Level 0 — awaiting manager)');
    console.log('  - Request 2: Pending (Level 1 — awaiting finance)');
    console.log('  - Request 3: Fully Approved (awaiting payment)');

    // ─── Summary ─────────────────────────────────────────────────────
    console.log('\n=== SEED COMPLETE ===');
    console.log('Login credentials (all passwords: password123):');
    console.log('  admin@acme.com    | admin');
    console.log('  director@acme.com | director');
    console.log('  manager@acme.com  | manager');
    console.log('  finance@acme.com  | finance');
    console.log('  employee@acme.com | employee');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
