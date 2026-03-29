import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ROLES } from '../utils/auth';
import { LogOut, Home, UserCheck, CreditCard, ShieldCheck, Settings, FileText } from 'lucide-react';

const Sidebar = () => {
  const { role, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = () => {
    const links = [
      { to: `/${role}`, icon: Home, label: 'Dashboard' }
    ];

    if (role === ROLES.EMPLOYEE) {
      links.push({ to: '/employee/requests', icon: FileText, label: 'My Requests' });
    }
    if (role === ROLES.MANAGER) {
      links.push({ to: '/manager/approvals', icon: UserCheck, label: 'Team Approvals' });
    }
    if (role === ROLES.FINANCE) {
      links.push({ to: '/finance/verifications', icon: CreditCard, label: 'Verifications' });
    }
    if (role === ROLES.DIRECTOR) {
      links.push({ to: '/director/final', icon: ShieldCheck, label: 'Final Approvals' });
    }
    if (role === ROLES.ADMIN) {
      links.push({ to: '/admin/users', icon: Settings, label: 'User Management' });
    }
    return links;
  };

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold tracking-tight text-blue-400">RMS</h1>
        <p className="text-slate-400 text-sm mt-1">{user?.name || 'User'}</p>
        <p className="text-xs font-semibold text-slate-500 uppercase mt-2">{role}</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {getLinks().map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
              end
            >
              <Icon size={20} />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
