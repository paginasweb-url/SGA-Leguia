import api from './api';

export const getMyNotifications = async (limit = 10) => {
  const response = await api.get('/notifications/me', {
    params: {
      limit
    }
  });

  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};