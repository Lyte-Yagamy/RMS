const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file located at backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  // Email config — set these in your .env file to send real emails
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: parseInt(process.env.EMAIL_PORT) || 587,
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@expense-rms.com',
};
