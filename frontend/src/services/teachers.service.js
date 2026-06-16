import api from './api';

export const getTeachers = async () => {
  const response = await api.get('/teachers');
  return response.data;
};