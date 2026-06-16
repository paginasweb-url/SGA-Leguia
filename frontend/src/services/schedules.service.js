import api from './api';

export const getSchedules = async () => {
  const response = await api.get('/schedules');
  return response.data;
};

export const getMySchedules = async () => {
  const response = await api.get('/schedules/me');
  return response.data;
};

export const getScheduleById = async (id) => {
  const response = await api.get(`/schedules/${id}`);
  return response.data;
};

export const createSchedule = async (payload) => {
  const response = await api.post('/schedules', payload);
  return response.data;
};

export const updateSchedule = async ({ id, payload }) => {
  const response = await api.put(`/schedules/${id}`, payload);
  return response.data;
};

export const deleteSchedule = async (id) => {
  const response = await api.delete(`/schedules/${id}`);
  return response.data;
};