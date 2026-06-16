import api from './api';

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createAdministrativeUser = async (payload) => {
  const response = await api.post('/users', payload);
  return response.data;
};

export const updateUser = async ({ id, payload }) => {
  const response = await api.put(`/users/${id}`, payload);
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await api.patch(`/users/${id}/deactivate`);
  return response.data;
};

export const getStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const updateStudent = async ({ id, payload }) => {
  const response = await api.put(`/students/${id}`, payload);
  return response.data;
};

export const deactivateStudent = async (id) => {
  const response = await api.patch(`/students/${id}/deactivate`);
  return response.data;
};

export const getTeachers = async () => {
  const response = await api.get('/teachers');
  return response.data;
};

export const createTeacher = async (payload) => {
  const response = await api.post('/teachers', payload);
  return response.data;
};

export const updateTeacher = async ({ id, payload }) => {
  const response = await api.put(`/teachers/${id}`, payload);
  return response.data;
};

export const deactivateTeacher = async (id) => {
  const response = await api.patch(`/teachers/${id}/deactivate`);
  return response.data;
};

export const getGuardians = async () => {
  const response = await api.get('/guardians');
  return response.data;
};

export const updateGuardian = async ({ id, payload }) => {
  const response = await api.put(`/guardians/${id}`, payload);
  return response.data;
};

export const deactivateGuardian = async (id) => {
  const response = await api.patch(`/guardians/${id}/deactivate`);
  return response.data;
};