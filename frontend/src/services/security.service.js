import api from './api';

export const getPasswordRecoveryRequests = async ({
  estado,
  tipo,
  usuario,
  fechaInicio,
  fechaFin,
  page = 1,
  limit = 50
} = {}) => {
  const response = await api.get('/password-recovery/requests', {
    params: {
      estado: estado || undefined,
      tipo: tipo || undefined,
      usuario: usuario || undefined,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
      page,
      limit
    }
  });

  return response.data;
};

export const getPasswordRecoveryRequestById = async (id) => {
  const response = await api.get(`/password-recovery/requests/${id}`);
  return response.data;
};

export const approvePasswordRecoveryRequest = async ({ id, observacion }) => {
  const response = await api.patch(`/password-recovery/requests/${id}/approve`, {
    observacion
  });

  return response.data;
};

export const rejectPasswordRecoveryRequest = async ({ id, observacion }) => {
  const response = await api.patch(`/password-recovery/requests/${id}/reject`, {
    observacion
  });

  return response.data;
};

export const manualPasswordReset = async ({ userId, observacion }) => {
  const response = await api.patch(`/password-recovery/users/${userId}/reset`, {
    observacion
  });

  return response.data;
};

export const getAccessHistory = async ({
  usuario,
  rol,
  resultado,
  fechaInicio,
  fechaFin,
  page = 1,
  limit = 50
} = {}) => {
  const response = await api.get('/auth/access-history', {
    params: {
      usuario: usuario || undefined,
      rol: rol || undefined,
      resultado: resultado || undefined,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
      page,
      limit
    }
  });

  return response.data;
};