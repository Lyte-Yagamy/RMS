import { useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { approveRequest, rejectRequest } from '../../services/requestService';

const ApprovalActionModal = ({ request, actionType, onClose, onSuccess }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isApproval = actionType === 'approve';
  const ActionIcon = isApproval ? Check : X;
  const actionColor = isApproval ? 'green' : 'red';
  const actionText = isApproval ? 'Approve' : 'Reject';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isApproval) {
        await approveRequest(request._id, { comment });
      } else {
        await rejectRequest(request._id, { comment });
      }
      onSuccess(); // Close modal and refresh underlying dashboard
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(`Failed to ${actionType} request. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = {
    approve: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      textBtn: 'text-green-600',
      hoverText: 'hover:text-green-800',
      hoverBg: 'hover:bg-green-100',
      strong: 'text-green-700',
      focusRing: 'focus:ring-green-500',
      focusBorder: 'focus:border-green-500',
      btnBg: 'bg-green-600',
      btnHover: 'hover:bg-green-700'
    },
    reject: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      textBtn: 'text-red-600',
      hoverText: 'hover:text-red-800',
      hoverBg: 'hover:bg-red-100',
      strong: 'text-red-700',
      focusRing: 'focus:ring-red-500',
      focusBorder: 'focus:border-red-500',
      btnBg: 'bg-red-600',
      btnHover: 'hover:bg-red-700'
    }
  };

  const theme = colors[actionType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`flex justify-between items-center px-6 py-4 border-b border-gray-100 ${theme.bg}`}>
          <div className={`flex items-center gap-2 ${theme.text} font-bold text-lg`}>
            <ActionIcon size={20} />
            <span>{actionText} Request</span>
          </div>
          <button 
            onClick={onClose}
            className={`${theme.textBtn} ${theme.hoverText} ${theme.hoverBg} p-1 rounded-md transition`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-lg">
            <p>You are about to <strong className={`${theme.strong} uppercase`}>{actionText}</strong> request <span className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">#{request._id.substring(request._id.length - 6)}</span>.</p>
            <p className="mt-1">Amount: <strong className="text-gray-900">${request.amount.toFixed(2)}</strong> for {request.category}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Add a Comment (Optional)</label>
            <textarea 
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${theme.focusRing} ${theme.focusBorder} outline-none transition resize-none`}
              placeholder={`Provide reasoning for this ${isApproval ? 'approval' : 'rejection'}...`}
            />
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-4 py-2 ${theme.btnBg} text-white font-medium rounded-lg ${theme.btnHover} transition flex items-center gap-2 disabled:opacity-70`}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Processing...' : actionText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalActionModal;
