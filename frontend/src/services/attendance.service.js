import api from './api';

export const getAttendanceClassrooms = async () => {
  const response = await api.get('/attendance/classrooms');
  return response.data;
};

export const getClassroomStudentsForAttendance = async (aulaId) => {
  const response = await api.get(`/attendance/classroom/${aulaId}/students`);
  return response.data;
};

export const getClassroomAttendanceByDate = async ({ aulaId, fecha }) => {
  const response = await api.get(`/attendance/classroom/${aulaId}`, {
    params: { fecha }
  });

  return response.data;
};

export const registerClassroomAttendance = async (payload) => {
  const response = await api.post('/attendance/classroom', payload);
  return response.data;
};

export const getClassroomAttendanceSummary = async ({
  aulaId,
  fecha,
  fechaInicio,
  fechaFin
}) => {
  const response = await api.get(`/attendance/classroom/${aulaId}/summary`, {
    params: {
      fecha,
      fechaInicio,
      fechaFin
    }
  });

  return response.data;
};

export const getStudentAttendance = async (studentId) => {
  const response = await api.get(`/attendance/student/${studentId}`);
  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get('/attendance/me');
  return response.data;
};