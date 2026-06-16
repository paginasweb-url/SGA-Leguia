import api from './api';

export const getAcademicPeriodsForAnnualResults = async () => {
  const response = await api.get('/academic-periods');
  return response.data;
};

export const getClassroomsForAnnualResults = async () => {
  const response = await api.get('/classrooms', {
    params: { estado: 'activo' }
  });

  return response.data;
};

export const getTeacherAssignmentsForAnnualResults = async () => {
  const response = await api.get('/teacher-courses/me');
  return response.data;
};

export const getClassroomAnnualResults = async ({ aulaId, periodoId }) => {
  const response = await api.get(`/annual-results/classroom/${aulaId}`, {
    params: {
      periodo_id: periodoId
    }
  });

  return response.data;
};

export const getClassroomAnnualSummary = async ({ aulaId, periodoId }) => {
  const response = await api.get(`/annual-results/classroom/${aulaId}/summary`, {
    params: {
      periodo_id: periodoId
    }
  });

  return response.data;
};

export const getStudentAnnualResult = async ({ studentId, periodoId }) => {
  const response = await api.get(`/annual-results/student/${studentId}`, {
    params: {
      periodo_id: periodoId
    }
  });

  return response.data;
};

export const getMyAnnualResult = async ({ periodoId }) => {
  const response = await api.get('/annual-results/me', {
    params: {
      periodo_id: periodoId
    }
  });

  return response.data;
};