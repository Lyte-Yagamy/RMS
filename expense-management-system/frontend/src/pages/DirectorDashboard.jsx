import { useState } from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';

const DirectorDashboard = () => {
  const [requests, setRequests] = useState([
    { id: '22', employee: 'David Boss', amount: 15400.00, title: 'Annual Company Retreat Booking', date: '2023-11-10' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Final Approvals</h1>
        <p className="text-base text-gray-600">Executive overview of large-budget requests.</p>
      </div>

      <div className="flex flex-col space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white border-l-4 border-purple-600 shadow rounded-r-lg p-5 hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{req.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{req.employee}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{req.date}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 mt-1">Ready for signature</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button className="text-red-600 font-semibold px-4 py-2 hover:bg-red-50 rounded transition">Reject Funds</button>
              <button className="bg-purple-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-purple-700 hover:shadow-lg transition flex items-center gap-2">
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
