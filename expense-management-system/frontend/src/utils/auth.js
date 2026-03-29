export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getToken = () => {
  return localStorage.getItem('authToken');
};

export const removeToken = () => {
  localStorage.removeItem('authToken');
};

// Mock roles for UI demonstration since backend may not be fully ready.
export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  FINANCE: 'finance',
  DIRECTOR: 'director',
  ADMIN: 'admin',
};
