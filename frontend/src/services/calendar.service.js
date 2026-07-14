import api from './api';

const cleanParams = (params = {}) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

export const getCalendarEvents = async ({
  estado = 'activo',
  desde = '',
  hasta = '',
  tipo_evento = 'todos'
} = {}) => {
  const response = await api.get('/calendar', {
    params: cleanParams({
      estado,
      desde,
      hasta,
      tipo_evento
    })
  });

  return response.data;
};

export const getCalendarClassrooms = async () => {
  const response = await api.get('/calendar/classrooms');
  return response.data;
};

export const createCalendarEvent = async (payload) => {
  const response = await api.post('/calendar', payload);
  return response.data;
};

export const updateCalendarEvent = async ({
  id,
  payload
}) => {
  const response = await api.put(`/calendar/${id}`, payload);
  return response.data;
};

export const cancelCalendarEvent = async ({
  id,
  motivo
}) => {
  const response = await api.patch(`/calendar/${id}/cancel`, {
    motivo
  });

  return response.data;
};