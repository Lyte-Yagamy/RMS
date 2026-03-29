import { useState, useEffect } from 'react';
import { Users, Activity, Loader2, DollarSign, Database, FileText } from 'lucide-react';
import { getAnalytics, getUsers, getAllCompanyRequests } from '../services/adminService';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, users, requests
  
  const [analytics, setAnalytics] = useState(null);
  const [userList, setUserList] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'analytics') {
        const data = await getAnalytics();
        setAnalytics(data.data);
      } else if (activeTab === 'users') {
        const data = await getUsers();
        setUserList(data.data || []);
      } else if (activeTab === 'requests') {
        const data = await getAllCompanyRequests();
        setAllRequests(data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
    fetchDashboardData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage network analytics, users, and company-wide requests.</p>
      </div>

      <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 p-1 mb-6 max-w-lg">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Activity size={16} /> Analytics
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition ${activeTab === 'users' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Users size={16} /> Users
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition ${activeTab === 'requests' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Database size={16} /> Requests
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && analytics?.overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-4"><FileText size={24} /></div>
                <div>
                  <div className="text-sm text-gray-500 font-medium tracking-wide">TOTAL REQUESTS</div>
                  <div className="text-2xl font-bold text-gray-800">{analytics.overview.totalRequests}</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                <div className="bg-green-100 p-3 rounded-full text-green-600 mr-4"><DollarSign size={24} /></div>
                <div>
                  <div className="text-sm text-gray-500 font-medium tracking-wide">APPROVED SPEND</div>
                  <div className="text-2xl font-bold text-gray-800">${analytics.overview.totalApprovedAmount.toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 mr-4"><Users size={24} /></div>
                <div>
                  <div className="text-sm text-gray-500 font-medium tracking-wide">TOTAL USERS</div>
                  <div className="text-2xl font-bold text-gray-800">{analytics.userStats?.total || 0}</div>
                </div>
              </div>
              
              {/* Category Breakdown Mock UI Frame */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Category Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(analytics.categoryBreakdown || []).map((cat, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800 capitalize">{cat._id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">${cat.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics.categoryBreakdown?.length === 0 && <div className="text-sm text-gray-400 py-4">No data mapped yet.</div>}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 animate-in fade-in duration-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {userList.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-bold uppercase rounded">{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userList.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 animate-in fade-in duration-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {allRequests.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.employeeId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{r.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">${r.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded border
                            ${r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                              r.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allRequests.length === 0 && <div className="p-8 text-center text-gray-500">No requests log found in the company.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
