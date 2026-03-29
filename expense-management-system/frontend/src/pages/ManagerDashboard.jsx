import { useState } from 'react';
import { Check, X } from 'lucide-react';

const ManagerDashboard = () => {
  const [requests, setRequests] = useState([
    { id: '3', employee: 'John Doe', amount: 350.50, title: 'Conference Tickets', date: '2023-11-01' },
    { id: '4', employee: 'Alice Smith', amount: 80.00, title: 'Office Supplies', date: '2023-11-02' }
  ]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Team Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review pending requests from your direct reports.</p>
      </div>

      <div className="grid gap-6">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="space-y-1">
              <div className="font-semibold text-lg text-gray-800">{req.title}</div>
              <div className="text-sm text-gray-500">Submitted by <span className="font-medium text-gray-700">{req.employee}</span> on {req.date}</div>
              <div className="text-xl font-bold text-blue-600">${req.amount.toFixed(2)}</div>
            </div>
            
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <button className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 transition">
                <Check size={18} />
                <span>Approve</span>
              </button>
              <button className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition">
                <X size={18} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-500">No pending team approvals.</div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
