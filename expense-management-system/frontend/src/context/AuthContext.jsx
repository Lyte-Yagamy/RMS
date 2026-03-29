import { createContext, useState, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = getToken();
      const storedRole = localStorage.getItem('role');
      const storedUser = localStorage.getItem('user');
      
      if (token) {
        setIsAuthenticated(true);
        setRole(storedRole);
        // Robust check for JSON.parse
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Failed to initialize AuthContext from localStorage:', error);
      // If parsing fails, clear the corrupted data to allow a clean login
      removeToken();
      localStorage.clear();
    } finally {
      // Critical: Ensure loading is always set to false so the App renders
      setLoading(false);
    }
  }, []);

  const login = (data) => {
    // data should contain { token, role, user }
    setToken(data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setIsAuthenticated(true);
    setRole(data.role);
    setUser(data.user);
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
