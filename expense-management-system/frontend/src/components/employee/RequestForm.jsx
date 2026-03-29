import { useState, useRef } from 'react';
import { X, Loader2, Upload, FileCheck, ShieldAlert } from 'lucide-react';
import { createRequest } from '../../services/requestService';
import { uploadReceipt } from '../../services/uploadService';

const CATEGORIES = [
  'travel',
  'meals',
  'accommodation',
  'software',
  'hardware',
  'office supplies',
  'training',
  'other'
];

const RequestForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'travel',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0], // yyyy-mm-dd
    receiptUrl: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanMessage, setScanMessage] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error and start scanning
    setError(null);
    setIsScanning(true);
    setScanMessage('Uploading & Analyzing Receipt...');

    try {
      const response = await uploadReceipt(file);
      const { receiptUrl, ocr } = response.data;

      // Update form data with OCR results if available
      const updatedData = { ...formData, receiptUrl };

      if (ocr && ocr.parsed) {
        if (ocr.parsed.totalAmount) {
          updatedData.amount = ocr.parsed.totalAmount.toString();
        }
        if (ocr.parsed.date) {
          // Convert date string from receipt to yyyy-mm-dd if possible
          try {
            const dateObj = new Date(ocr.parsed.date);
            if (!isNaN(dateObj.getTime())) {
              updatedData.expenseDate = dateObj.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Date parsing failed:', e);
          }
        }
        if (ocr.parsed.vendor) {
          updatedData.description = `${ocr.parsed.vendor} - ${formData.description || ''}`.trim();
        }
        
        setScanMessage(`Scan complete! extracted amount: $${ocr.parsed.totalAmount || '???'}`);
      } else {
        setScanMessage('Receipt uploaded, but OCR parsing failed. Please fill manual fields.');
      }

      setFormData(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan receipt. You can still fill it manually.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Validate amount
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      await createRequest({
        ...formData,
        amount: amountNum
      });
      
      onSuccess(); // Triggers dashboard refresh & closes modal
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-gray-50/80">
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Expense Request</h2>
            <p className="text-sm text-gray-500">Upload a receipt to auto-fill details.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium flex items-center gap-3">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          {/* Receipt Upload Zone */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Receipt Attachment (Optional)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
                ${formData.receiptUrl ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-white'}`}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              {isScanning ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <p className="text-sm font-medium text-blue-700">{scanMessage}</p>
                </div>
              ) : formData.receiptUrl ? (
                <div className="flex flex-col items-center gap-2 text-green-700">
                  <FileCheck size={32} />
                  <p className="text-sm font-bold">Receipt Attached Successfully</p>
                  <p className="text-xs text-green-600 opacity-80">{scanMessage || 'Fields auto-filled from AI scan.'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload size={32} />
                  <p className="text-sm font-medium">Click to upload or drag & drop</p>
                  <p className="text-xs">Supports JPG, PNG, WEBP, PDF (max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Amount</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-blue-600 transition">$</span>
                <input 
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white font-semibold text-gray-800"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Category</label>
              <select 
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition capitalize bg-white font-medium"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Expense Date</label>
            <input 
              type="date"
              name="expenseDate"
              required
              value={formData.expenseDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Description / Justification</label>
            <textarea 
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none bg-white font-medium"
              placeholder="Provide a reason for this expense..."
            />
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isScanning}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
