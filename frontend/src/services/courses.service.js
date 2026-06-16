import api from './api';

export const getCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};

export const getCourseById = async (id) => {
  const response = await api.get(`/courses/${id}`);
  return response.data;
};

export const createCourse = async (payload) => {
  const response = await api.post('/courses', payload);
  return response.data;
};

export const updateCourse = async ({ id, payload }) => {
  const response = await api.put(`/courses/${id}`, payload);
  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await api.delete(`/courses/${id}`);
  return response.data;
};
export const getMyTeacherCourses = async () => {
  const response = await api.get('/teacher-courses/me');
  return response.data;
};

export const getMyTeacherStudents = async () => {
  const response = await api.get('/teacher-courses/me/students');
  return response.data;
};

export const getMyCourses = async () => {
  const response = await api.get('/courses/me');
  return response.data;
};