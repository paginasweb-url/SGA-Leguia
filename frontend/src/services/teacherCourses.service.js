import api from './api';

export const getTeacherCourses = async () => {
  const response = await api.get('/teacher-courses');
  return response.data;
};

export const createTeacherCourse = async (payload) => {
  const response = await api.post('/teacher-courses', payload);
  return response.data;
};

export const getTeacherCoursesByTeacher = async (teacherId) => {
  const response = await api.get(`/teacher-courses/teacher/${teacherId}`);
  return response.data;
};

export const getTeacherCoursesByClassroom = async (classroomId) => {
  const response = await api.get(`/teacher-courses/classroom/${classroomId}`);
  return response.data;
};

export const deleteTeacherCourse = async (id) => {
  const response = await api.delete(`/teacher-courses/${id}`);
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