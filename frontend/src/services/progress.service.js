import api from './api';

export const getMyProgress = async () => {
  const response = await api.get('/progress/me');
  return response.data;
};

export const getStudentProgress = async (studentId) => {
  const response = await api.get(`/progress/student/${studentId}`);
  return response.data;
};

export const getAcademicPeriodsForProgress = async () => {
  const response = await api.get('/academic-periods');
  return response.data;
};

export const getMyAnnualResultForProgress = async ({ periodoId }) => {
  const response = await api.get('/annual-results/me', {
    params: {
      periodo_id: periodoId
    }
  });

  return response.data;
};