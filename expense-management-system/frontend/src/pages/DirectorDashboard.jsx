import { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, X, Loader2, Check } from 'lucide-react';
import { getAllRequests } from '../services/requestService';
import ApprovalActionModal from '../components/shared/ApprovalActionModal';

const DirectorDashboard = () => {
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
      setError('Failed to load pending final approvals. Please try again.');
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
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-2 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Final Approvals</h1>
        <p className="text-base text-gray-600">Executive overview of large-budget requests awaiting your final signature.</p>
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
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-500">
          <Check className="mx-auto h-12 w-12 text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Clear Desk!</h2>
          <p className="text-gray-500 mt-2">There are no requests waiting for a final signature from the Director.</p>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {requests.map(req => (
          <div key={req._id} className="bg-white border-l-4 border-purple-600 shadow rounded-r-lg p-5 hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800 capitalize">{req.category}</h3>
                <div className="text-gray-600 mt-1 max-w-2xl">{req.description}</div>
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{req.employeeId?.name || 'Unknown'}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span>•</span>
                  <span className="text-xs uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                    ID: {req._id.substring(req._id.length - 6)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 mt-1">Ready for signature</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button 
                onClick={() => setActiveAction({ request: req, type: 'reject' })}
                className="flex items-center gap-1 text-red-600 font-semibold px-4 py-2 border border-transparent hover:border-red-200 hover:bg-red-50 rounded transition"
              >
                <X size={18} />
                Reject Funds
              </button>
              <button 
                onClick={() => setActiveAction({ request: req, type: 'approve' })}
                className="bg-purple-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-purple-700 hover:shadow-lg transition flex items-center gap-2"
              >
                <ShieldCheck size={18} />
                Confirm & Pay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DirectorDashboard;
