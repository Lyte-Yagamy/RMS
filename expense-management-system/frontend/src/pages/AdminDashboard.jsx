import { Users, Activity, Settings as SettingsIcon } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users, roles, and system configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600 mb-4">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-2">Add, edit, and deactivate system users and assign hierarchy.</p>
          <button className="mt-6 w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition">Manage Users</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
          <div className="bg-green-100 p-4 rounded-full text-green-600 mb-4">
            <Activity size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">System Analytics</h2>
          <p className="text-sm text-gray-500 mt-2">View application logs, performance, and general metrics.</p>
          <button className="mt-6 w-full py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition">View Stats</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
          <div className="bg-slate-100 p-4 rounded-full text-slate-600 mb-4">
            <SettingsIcon size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Platform Settings</h2>
          <p className="text-sm text-gray-500 mt-2">Configure email servers, OCR API keys, and workflow rules.</p>
          <button className="mt-6 w-full py-2 bg-slate-800 text-white font-medium rounded hover:bg-slate-900 transition">Go to Settings</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
