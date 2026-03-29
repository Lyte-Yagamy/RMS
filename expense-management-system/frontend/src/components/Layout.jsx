import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white shadow border-b border-gray-200 p-4 shrink-0">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Workspace</h2>
            <div className="flex items-center gap-4">
              {/* Add notification or user profile icon here */}
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                U
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 relative overflow-y-auto">
          <div className="mx-auto max-w-7xl h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
