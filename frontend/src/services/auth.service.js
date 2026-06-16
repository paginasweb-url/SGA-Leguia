import api from './api';

export const loginRequest = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const changePasswordRequest = async (data) => {
  const response = await api.patch('/auth/change-password', data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};