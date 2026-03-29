const multer = require('multer');
const path = require('path');

/**
 * Multer Upload Configuration
 * Handles receipt image uploads and stores them in /uploads/receipts/
 *
 * Supports: JPEG, PNG, GIF, BMP, TIFF, WebP, PDF
 * Max size: 10 MB
 */

// ─── Storage Configuration ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../../../uploads/receipts');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: userId-timestamp-originalname
    const uniqueName = `${req.user._id}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// ─── File Filter ────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'application/pdf',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not supported. Allowed: JPEG, PNG, GIF, BMP, TIFF, WebP, PDF`), false);
  }
};

// ─── Multer Instance ────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
});

module.exports = upload;
