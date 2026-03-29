import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ROLES } from '../utils/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Mock login since backend endpoint isn't wired yet
      // Simulate real data behavior
      if (email.includes('employee')) {
        login({ token: 'mock-token-emp', role: ROLES.EMPLOYEE, user: { name: 'Emp User' } });
        navigate('/employee');
      } else if (email.includes('manager')) {
        login({ token: 'mock-token-mgr', role: ROLES.MANAGER, user: { name: 'Mgr User' } });
        navigate('/manager');
      } else if (email.includes('finance')) {
        login({ token: 'mock-token-fin', role: ROLES.FINANCE, user: { name: 'Fin Admin' } });
        navigate('/finance');
      } else if (email.includes('director')) {
        login({ token: 'mock-token-dir', role: ROLES.DIRECTOR, user: { name: 'Director User' } });
        navigate('/director');
      } else if (email.includes('admin')) {
        login({ token: 'mock-token-adm', role: ROLES.ADMIN, user: { name: 'Super Admin' } });
        navigate('/admin');
      } else {
        setError('Use employee, manager, finance, director, or admin in email to mock roles');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            RMS Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your expense requests
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-md border border-red-200">{error}</div>}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Ex. employee@rms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
