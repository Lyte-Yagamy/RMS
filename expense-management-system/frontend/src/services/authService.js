import apiClient from './api';

/**
 * Perform login request
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Responds with { token, user, message }
 */
export const loginRequest = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Perform register request
 * @param {Object} userData - { name, email, password, role }
 */
export const registerRequest = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};
