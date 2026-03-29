import apiClient from './api';

/**
 * Fetch all requests submitted by the logged-in employee.
 * @param {Object} params - Optional query filters (status, page, limit)
 * @returns {Promise<Object>} Contains data array and pagination.
 */
export const getMyRequests = async (params = {}) => {
  const response = await apiClient.get('/request/my', { params });
  return response.data;
};

/**
 * Create a new expense request.
 * @param {Object} data - { amount, category, description, expenseDate }
 */
export const createRequest = async (data) => {
  const response = await apiClient.post('/request/create', data);
  return response.data;
};

/**
 * Fetch company-wide requests (scoped by backend role automatically).
 * @param {Object} params - Optional query filters (status, category, page, limit)
 * @returns {Promise<Object>} Contains data array and pagination.
 */
export const getAllRequests = async (params = {}) => {
  const response = await apiClient.get('/request/all', { params });
  return response.data;
};

/**
 * Approve a pending request.
 * @param {string} id - The request ID
 * @param {Object} data - { comment } optional comment
 */
export const approveRequest = async (id, data = {}) => {
  const response = await apiClient.put(`/request/approve/${id}`, data);
  return response.data;
};

/**
 * Reject a pending request.
 * @param {string} id - The request ID
 * @param {Object} data - { comment } optional comment
 */
export const rejectRequest = async (id, data = {}) => {
  const response = await apiClient.put(`/request/reject/${id}`, data);
  return response.data;
};
