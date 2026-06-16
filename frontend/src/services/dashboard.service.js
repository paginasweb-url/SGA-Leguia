import api from './api';

export const getDirectorDashboardReport = async () => {
  const response = await api.get('/reports/dashboard');
  return response.data;
};

export const getTeacherDashboardReport = async () => {
  const response = await api.get('/dashboard/teacher');
  return response.data;
};

export const getAuxiliaryDashboardReport = async () => {
  const response = await api.get('/dashboard/auxiliary');
  return response.data;
};