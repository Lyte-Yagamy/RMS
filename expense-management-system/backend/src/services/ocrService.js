const Tesseract = require('tesseract.js');
const path = require('path');

/**
 * OCR Service
 * Uses Tesseract.js to extract text from uploaded receipt images.
 * Parses extracted text to identify common expense fields like
 * total amount, date, and vendor name.
 */

/**
 * Extract raw text from a receipt image using Tesseract OCR.
 * @param {string} imagePath - Absolute path to the receipt image file
 * @returns {Object} { rawText, confidence }
 */
const extractTextFromReceipt = async (imagePath) => {
  try {
    console.log(`[OCR] Processing image: ${imagePath}`);

    const { data } = await Tesseract.recognize(imagePath, 'eng', {
      logger: (info) => {
        if (info.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${(info.progress * 100).toFixed(1)}%`);
        }
      },
    });

    return {
      rawText: data.text,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error(`[OCR] Error processing image: ${error.message}`);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

/**
 * Parse extracted OCR text to identify common receipt fields.
 * Uses regex patterns to find amounts, dates, and vendor info.
 *
 * @param {string} rawText - Raw text from OCR extraction
 * @returns {Object} Parsed fields { totalAmount, date, vendor, items }
 */
const parseReceiptText = (rawText) => {
  const result = {
    totalAmount: null,
    date: null,
    vendor: null,
    items: [],
  };

  if (!rawText || rawText.trim().length === 0) {
    return result;
  }

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // ─── Extract Total Amount ──────────────────────────────────────────
  // Look for patterns like "Total: $123.45", "TOTAL 123.45", "Grand Total: 1,234.56"
  const totalPatterns = [
    /(?:grand\s*)?total[\s:]*\$?\s*([\d,]+\.?\d*)/i,
    /(?:amount\s*due|balance\s*due)[\s:]*\$?\s*([\d,]+\.?\d*)/i,
    /(?:net\s*amount|subtotal)[\s:]*\$?\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of totalPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      result.totalAmount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // ─── Extract Date ─────────────────────────────────────────────────
  // Common date formats: MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, Month DD YYYY
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      result.date = match[1];
      break;
    }
  }

  // ─── Extract Vendor Name ──────────────────────────────────────────
  // Usually the first non-empty meaningful line of the receipt
  if (lines.length > 0) {
    // Skip lines that are just numbers, dates, or very short
    for (const line of lines) {
      if (line.length > 3 && !/^\d+$/.test(line) && !/^\d{1,2}[\/\-]/.test(line)) {
        result.vendor = line;
        break;
      }
    }
  }

  // ─── Extract Line Items ───────────────────────────────────────────
  // Look for lines with a price pattern at the end: "Item name    $12.34"
  const itemPattern = /^(.+?)\s+\$?\s*([\d,]+\.\d{2})\s*$/;
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match) {
      result.items.push({
        description: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, '')),
      });
    }
  }

  return result;
};

/**
 * Full OCR pipeline: extract text → parse fields.
 * @param {string} imagePath - Path to receipt image
 * @returns {Object} { rawText, confidence, parsed: { totalAmount, date, vendor, items } }
 */
const processReceipt = async (imagePath) => {
  const { rawText, confidence } = await extractTextFromReceipt(imagePath);
  const parsed = parseReceiptText(rawText);

  return {
    rawText,
    confidence,
    parsed,
  };
};

module.exports = { extractTextFromReceipt, parseReceiptText, processReceipt };
