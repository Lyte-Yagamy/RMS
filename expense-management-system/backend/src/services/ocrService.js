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
  // Look for patterns like "Total", "Amount Due", "Balance", etc.
  const totalPatterns = [
    /(?:grand\s*)?total[\s:]*[$£€]?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:amount\s*due|balance\s*due|total\s*due)[\s:]*[$£€]?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:net\s*amount|payable|to\s*pay)[\s:]*[$£€]?\s*([\d,]+(?:\.\d{2})?)/i,
    /[$£€]\s*([\d,]+(?:\.\d{2})?)/ // Standalone currency pattern
  ];

  for (const pattern of totalPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      // Clean up string: remove commas, then parse
      const cleanAmount = match[1].replace(/,/g, '');
      result.totalAmount = parseFloat(cleanAmount);
      break;
    }
  }

  // ─── Extract Date ─────────────────────────────────────────────────
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/, // 10/12/2023, 10-12-23, 10.12.2023
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/, // 2023/12/10
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i, // Dec 10, 2023
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i  // 10 Dec 2023
  ];

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      result.date = match[1];
      break;
    }
  }

  // ─── Extract Vendor Name ──────────────────────────────────────────
  // Usually the header of the receipt. We skip lines that look like:
  // - Dates, phone numbers, website URLs, or pure numbers
  const noisePatterns = [
    /^[\d\/\-\.\s]+$/, // Only digits/date chars
    /\d{3}[-\s]?\d{3}[-\s]?\d{4}/, // Phone numbers
    /www\.|http|@|\.com/i, // Web/Email
    /tax\s*id|gst|vat/i // Tax info
  ];

  if (lines.length > 0) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      const isNoise = noisePatterns.some(p => p.test(line));
      if (line.length > 3 && !isNoise) {
        result.vendor = line;
        break;
      }
    }
  }

  // ─── Extract Line Items ───────────────────────────────────────────
  // Pattern: "Item Description   12.34" or "Item Description $12.34"
  const itemPattern = /^(.+?)\s+[$£€]?\s*([\d,]+(?:\.\d{2})?)\s*$/;
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match && !/total|subtotal|tax|balance/i.test(match[1])) {
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
