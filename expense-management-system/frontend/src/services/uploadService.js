import apiClient from './api';

/**
 * Upload a receipt image file to the backend for storage and OCR processing.
 * @param {File} file - The receipt image/PDF file from the input
 * @returns {Promise<Object>} Contains receiptUrl and ocrResults
 */
export const uploadReceipt = async (file) => {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await apiClient.post('/upload/receipt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
