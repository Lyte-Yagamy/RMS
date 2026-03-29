import { useState } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';

const FinanceDashboard = () => {
  const [requests, setRequests] = useState([
    { id: '12', employee: 'Mark Johnson', amount: 5000.00, title: 'Server Upgrade', date: '2023-11-05' },
    { id: '15', employee: 'Sarah Connor', amount: 1200.00, title: 'Travel Allocation', date: '2023-11-06' }
  ]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Financial Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Review manager-approved requests for budget consistency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-lg border border-gray-100 shadow-md flex flex-col hover:shadow-lg transition-shadow">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full uppercase">Finance Verification</span>
                <span className="text-sm font-semibold text-gray-400">#{req.id}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{req.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{req.employee}</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">${req.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
              <div className="text-sm text-gray-500">{req.date}</div>
              <button className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition shadow-sm text-sm font-medium">
                <CheckCircle size={16} />
                <span>Verify</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceDashboard;
