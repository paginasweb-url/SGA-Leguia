import api from './api';

export const getMyGuardianChildren = async () => {
  const response = await api.get('/progress/me');
  return response.data;
};