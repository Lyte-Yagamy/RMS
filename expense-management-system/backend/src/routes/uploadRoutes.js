const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { processReceipt } = require('../services/ocrService');

/**
 * Upload Routes
 *
 * POST /api/upload/receipt     — Upload a receipt image and run OCR
 */

/**
 * @desc    Upload a receipt image, store it, and run Tesseract OCR
 * @route   POST /api/upload/receipt
 * @access  Private
 *
 * Returns the file URL and OCR-parsed fields (totalAmount, date, vendor, items)
 * so the frontend can auto-fill the expense form.
 */
router.post('/receipt', protect, upload.single('receipt'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file uploaded',
      });
    }

    // Build the public URL for the uploaded file
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    const absolutePath = req.file.path;

    // Run OCR on the uploaded image
    let ocrResult = null;
    try {
      ocrResult = await processReceipt(absolutePath);
    } catch (ocrError) {
      console.error('[Upload] OCR failed, but file was saved:', ocrError.message);
      // OCR failure is non-fatal — the file is still uploaded
    }

    res.status(200).json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: {
        receiptUrl,
        filename: req.file.filename,
        size: req.file.size,
        ocr: ocrResult
          ? {
              confidence: ocrResult.confidence,
              parsed: ocrResult.parsed,
              rawTextPreview: ocrResult.rawText.substring(0, 500),
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
