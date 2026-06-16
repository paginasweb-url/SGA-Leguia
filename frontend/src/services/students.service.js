import api from './api';

export const getStudentsRequest = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const createStudentRequest = async (student) => {
  const response = await api.post('/students', student);
  return response.data;
};

export const updateStudentRequest = async (id, student) => {
  const response = await api.put(`/students/${id}`, student);
  return response.data;
};

export const deactivateStudentRequest = async (id) => {
  const response = await api.patch(`/students/${id}/deactivate`);
  return response.data;
};