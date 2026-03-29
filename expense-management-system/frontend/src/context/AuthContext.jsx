import { createContext, useState, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedRole = localStorage.getItem('role');
    const storedUser = localStorage.getItem('user');
    
    // In a real app, we would validate the token with the backend here
    if (token) {
      setIsAuthenticated(true);
      setRole(storedRole);
      setUser(storedUser ? JSON.parse(storedUser) : null);
    }
    setLoading(false);
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
