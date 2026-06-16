import api from './api';

export const getGrades = async () => {
  const response = await api.get('/grades');
  return response.data;
};

export const createGrade = async (payload) => {
  const response = await api.post('/grades', payload);
  return response.data;
};

export const updateGrade = async ({ id, payload }) => {
  const response = await api.put(`/grades/${id}`, payload);
  return response.data;
};

export const deleteGrade = async (id) => {
  const response = await api.delete(`/grades/${id}`);
  return response.data;
};