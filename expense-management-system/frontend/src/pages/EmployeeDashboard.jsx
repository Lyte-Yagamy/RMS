import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const [requests, setRequests] = useState([
    { id: '1', date: '2023-10-01', amount: 150.00, status: 'Pending Manager', title: 'Client Lunch' },
    { id: '2', date: '2023-09-15', amount: 1200.00, status: 'Approved', title: 'Flight to NY' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <PlusCircle size={20} />
          <span>New Request</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">#{req.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">${req.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="text-center py-10 text-gray-500">No requests found. Create a new one.</div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
