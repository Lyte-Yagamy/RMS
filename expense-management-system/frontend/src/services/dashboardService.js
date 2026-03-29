import apiClient from './api';

/**
 * Fetch dashboard overview statistics tailored to the current user's role.
 * @returns {Promise<Object>} Contains overview, categoryBreakdown, and role-specific stats.
 */
export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard');
  return response.data.data;
};
