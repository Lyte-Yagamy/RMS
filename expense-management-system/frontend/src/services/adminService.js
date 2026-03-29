import apiClient from './api';

/**
 * Fetch all users for the company.
 * @param {Object} params - Optional query filters (role, page, limit)
 */
export const getUsers = async (params = {}) => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

/**
 * Fetch system analytics and financial overviews.
 */
export const getAnalytics = async () => {
  const response = await apiClient.get('/admin/analytics');
  return response.data;
};

/**
 * Fetch all requests across the entire company globally.
 * @param {Object} params - Optional query filters (status, category, page, limit)
 */
export const getAllCompanyRequests = async (params = {}) => {
  const response = await apiClient.get('/admin/all-requests', { params });
  return response.data;
};

/**
 * Admin create user
 * @param {Object} userData - { name, email, password, role }
 */
export const createUser = async (userData) => {
  const response = await apiClient.post('/admin/users', userData);
  return response.data;
};

/**
 * Admin change user role
 * @param {string} id - User ID
 * @param {string} role - New role
 */
export const updateUserRole = async (id, role) => {
  const response = await apiClient.put(`/admin/users/${id}/role`, { role });
  return response.data;
};

/**
 * Admin configure global approval rule constraints
 * @param {Object} ruleData - { type, percentage, requiredRole }
 */
export const setCompanyApprovalRule = async (ruleData) => {
  const response = await apiClient.put('/admin/settings/approval-rule', ruleData);
  return response.data;
};

/**
 * Admin force approve/reject
 * @param {string} requestId - The request ID
 * @param {string} action - 'approved' or 'rejected'
 * @param {string} comment - Optional override comment
 */
export const overrideRequestApproval = async (requestId, action, comment) => {
  const response = await apiClient.put(`/admin/override/${requestId}`, { action, comment });
  return response.data;
};
