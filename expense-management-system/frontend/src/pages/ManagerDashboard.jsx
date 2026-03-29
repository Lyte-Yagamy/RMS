import { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { getAllRequests } from '../services/requestService';
import ApprovalActionModal from '../components/shared/ApprovalActionModal';

const ManagerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for controlling the manual action modal
  const [activeAction, setActiveAction] = useState({ request: null, type: null });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllRequests();
      setRequests(data.data || []);
    } catch (err) {
      setError('Failed to load pending requests. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleActionComplete = () => {
    setActiveAction({ request: null, type: null });
    fetchRequests(); // Automatically refresh list on success
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Team Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review pending requests from your direct reports.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6 font-medium">
          {error}
        </div>
      )}

      {activeAction.request && (
        <ApprovalActionModal
          request={activeAction.request}
          actionType={activeAction.type}
          onClose={() => setActiveAction({ request: null, type: null })}
          onSuccess={handleActionComplete}
        />
      )}

      <div className="grid gap-6">
        {requests.map(req => (
          <div key={req._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="space-y-1">
              <div className="font-semibold text-lg text-gray-800 capitalize flex items-center gap-2">
                {req.category}
                <span className="text-xs tracking-wide bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  #{req._id.substring(req._id.length - 6)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Submitted by <span className="font-medium text-gray-700">{req.employeeId?.name || 'Unknown'}</span> on {new Date(req.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600 italic mt-1 bg-yellow-50 p-2 rounded border border-yellow-100">
                 "{req.description}"
              </div>
              <div className="text-xl font-bold text-blue-600 mt-2">
                {req.companyId?.baseCurrency || 'USD'} {req.amount.toFixed(2)}
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4 sm:mt-0 self-end sm:self-center">
              <button 
                onClick={() => setActiveAction({ request: req, type: 'approve' })}
                className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 transition font-medium"
              >
                <Check size={18} />
                <span>Approve</span>
              </button>
              <button 
                onClick={() => setActiveAction({ request: req, type: 'reject' })}
                className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium"
              >
                <X size={18} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        ))}
        {requests.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-500">
            <Check className="mx-auto h-8 w-8 text-green-400 mb-2" />
            <p>You're all caught up!</p>
            <p className="text-sm text-gray-400">No pending team approvals at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
