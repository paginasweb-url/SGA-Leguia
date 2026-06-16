import api from './api';

export const getMySettings = async () => {
  const response = await api.get('/settings/me');
  return response.data;
};

export const updateMyPreferences = async ({ theme_mode }) => {
  const response = await api.patch('/settings/me/preferences', {
    theme_mode
  });

  return response.data;
};

export const getAcademicPeriodsForSettings = async () => {
  const response = await api.get('/academic-periods');
  return response.data;
};