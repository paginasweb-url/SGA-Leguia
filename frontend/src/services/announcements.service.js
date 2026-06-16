import api from './api';

export const getAllAnnouncements = async () => {
  const response = await api.get('/announcements');
  return response.data;
};

export const getMyAnnouncements = async () => {
  const response = await api.get('/announcements/my');
  return response.data;
};

export const getAnnouncementById = async (id) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
};

export const createAnnouncement = async ({
  titulo,
  contenido,
  destinatario_tipo,
  aula_id
}) => {
  const payload = {
    titulo,
    contenido,
    destinatario_tipo
  };

  if (aula_id) {
    payload.aula_id = Number(aula_id);
  }

  const response = await api.post('/announcements', payload);
  return response.data;
};

export const markAnnouncementAsRead = async (id) => {
  const response = await api.patch(`/announcements/${id}/read`);
  return response.data;
};

export const getAnnouncementReadSummary = async (id) => {
  const response = await api.get(`/announcements/${id}/summary`);
  return response.data;
};