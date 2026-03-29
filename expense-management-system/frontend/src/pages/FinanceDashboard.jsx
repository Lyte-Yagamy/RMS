import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Loader2, Check, X } from 'lucide-react';
import { getAllRequests } from '../services/requestService';
import ApprovalActionModal from '../components/shared/ApprovalActionModal';

const FinanceDashboard = () => {
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
        <h1 className="text-2xl font-bold text-gray-900">Financial Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Review manager-approved requests for budget consistency.</p>
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

      {requests.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-500">
          <Check className="mx-auto h-8 w-8 text-green-400 mb-2" />
          <p>You're all caught up!</p>
          <p className="text-sm text-gray-400">No pending finance approvals at this time.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map(req => (
          <div key={req._id} className="bg-white rounded-lg border border-gray-100 shadow-md flex flex-col hover:shadow-lg transition-shadow">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1">
                  <CreditCard size={14} /> Verification
                </span>
                <span className="text-sm font-semibold text-gray-400">#{req._id.substring(req._id.length - 6)}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 capitalize">{req.category}</h3>
              <p className="text-gray-600 text-sm mt-1 mb-2 line-clamp-2" title={req.description}>{req.description}</p>
              <p className="text-gray-500 text-xs">Submitted by: <span className="font-semibold">{req.employeeId?.name || 'Unknown'}</span></p>
              
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">${req.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
              <div className="text-sm text-gray-500 font-medium">{new Date(req.createdAt).toLocaleDateString()}</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveAction({ request: req, type: 'reject'})}
                  className="bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100 transition shadow-sm border border-red-200"
                  title="Reject"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={() => setActiveAction({ request: req, type: 'approve'})}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition shadow-sm text-sm font-medium"
                >
                  <CheckCircle size={16} />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceDashboard;
