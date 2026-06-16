import api from './api';

export const getSections = async () => {
  const response = await api.get('/sections');
  return response.data;
};

export const createSection = async (payload) => {
  const response = await api.post('/sections', payload);
  return response.data;
};

export const updateSection = async ({ id, payload }) => {
  const response = await api.put(`/sections/${id}`, payload);
  return response.data;
};

export const deleteSection = async (id) => {
  const response = await api.delete(`/sections/${id}`);
  return response.data;
};