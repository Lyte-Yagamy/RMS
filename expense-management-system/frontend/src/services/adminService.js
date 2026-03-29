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
