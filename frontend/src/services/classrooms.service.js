import api from './api';

export const getClassrooms = async ({ estado } = {}) => {
  const response = await api.get('/classrooms', {
    params: {
      estado: estado || undefined
    }
  });

  return response.data;
};

export const getClassroomById = async (id) => {
  const response = await api.get(`/classrooms/${id}`);
  return response.data;
};

export const createClassroom = async (payload) => {
  const response = await api.post('/classrooms', payload);
  return response.data;
};

export const updateClassroom = async ({ id, payload }) => {
  const response = await api.put(`/classrooms/${id}`, payload);
  return response.data;
};

export const deactivateClassroom = async (id) => {
  const response = await api.delete(`/classrooms/${id}`);
  return response.data;
};