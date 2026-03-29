import { useState, useEffect } from 'react';
import { Users, Activity, Loader2, DollarSign, Database, FileText, Settings, ShieldAlert, Plus, Edit } from 'lucide-react';
import { getAnalytics, getUsers, getAllCompanyRequests, createUser, updateUserRole, setCompanyApprovalRule, overrideRequestApproval } from '../services/adminService';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, users, requests, settings
  
  const [analytics, setAnalytics] = useState(null);
  const [userList, setUserList] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee' });

  // Rule Form State
  const [rule, setRule] = useState({ type: 'sequential', percentage: null, requiredRole: '' });

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'employee' });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleOverride = async (requestId, action) => {
    if(!window.confirm(`Are you sure you want to FORCE ${action.toUpperCase()} this request?`)) return;
    try {
      await overrideRequestApproval(requestId, action, 'Admin Override');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to override request');
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      await setCompanyApprovalRule(rule);
      alert('Global approval rule updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage network analytics, users, global settings, and bypass requests.</p>
      </div>

      <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 p-1 mb-6 flex-wrap md:flex-nowrap gap-2 md:gap-0">
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
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Settings size={16} /> Settings
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 font-medium flex items-start gap-3">
          <ShieldAlert size={20} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && activeTab !== 'settings' ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && analytics?.overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
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
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Company Roster</h2>
                <button onClick={() => setShowAddUser(!showAddUser)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
                  <Plus size={16} /> Add Employee
                </button>
              </div>

              {showAddUser && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Register New User</h3>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="john@company.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                      <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role Assignment</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="finance">Finance</option>
                        <option value="director">Director</option>
                        <option value="admin">System Admin</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 pt-2 flex justify-end">
                      <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition">Create User</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Settings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {userList.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold uppercase rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="employee">EMPLOYEE</option>
                            <option value="manager">MANAGER</option>
                            <option value="finance">FINANCE</option>
                            <option value="director">DIRECTOR / CFO</option>
                            <option value="admin">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {userList.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
              </div>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Admin Action</th>
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
                      <td className="px-6 py-4 text-right space-x-2">
                        {r.status === 'pending' || r.status === 'in_progress' ? (
                          <>
                            <button onClick={() => handleOverride(r._id, 'approved')} className="text-xs bg-green-100 hover:bg-green-200 text-green-800 font-bold py-1 px-3 rounded transition">
                              FORCE APPROVE
                            </button>
                            <button onClick={() => handleOverride(r._id, 'rejected')} className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-3 rounded transition">
                              FORCE REJECT
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allRequests.length === 0 && <div className="p-8 text-center text-gray-500">No requests log found in the company.</div>}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-in fade-in duration-300 max-w-2xl">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Company Workflow Constraints</h2>
              <p className="text-gray-500 text-sm mb-6">Configure how expense requests route through the sequential approvers. The default is 'sequential' where every assigned approver must accept.</p>
              
              <form onSubmit={handleSaveRule} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Approval Constraint Type</label>
                  <select 
                    value={rule.type} 
                    onChange={e => setRule({...rule, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
                  >
                    <option value="sequential">Strict Sequential (Everyone must approve)</option>
                    <option value="role">Role Bypass (Specific role skips remaining chain)</option>
                    <option value="percentage">Percentage (Majority rules)</option>
                  </select>
                </div>

                {rule.type === 'role' && (
                  <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Required Override Role</label>
                    <p className="text-xs text-blue-700 mb-3">If this role approves, the request is immediately fully approved, skipping any pending approvers.</p>
                    <select 
                      value={rule.requiredRole} 
                      onChange={e => setRule({...rule, requiredRole: e.target.value})}
                      className="w-full px-4 py-2 border border-blue-200 rounded-md outline-none"
                      required
                    >
                      <option value="">Select a role...</option>
                      <option value="director">Director (CFO)</option>
                      <option value="finance">Finance</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                )}

                {rule.type === 'percentage' && (
                  <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Approval Percentage Required (%)</label>
                    <input 
                      type="number" 
                      min="1" max="100" 
                      value={rule.percentage || ''} 
                      onChange={e => setRule({...rule, percentage: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-blue-200 rounded-md outline-none"
                      placeholder="e.g. 51"
                      required
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">
                    Save Global Rules
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
