import api from './api';

export const requestPasswordRecovery = async (payload) => {
  const response = await api.post('/password-recovery/request', payload);
  return response.data;
};