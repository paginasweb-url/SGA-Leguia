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

export const getReinforcements = async ({
  estado = 'todos',
  desde = '',
  hasta = '',
  curso_id = ''
} = {}) => {
  const response = await api.get('/reinforcements', {
    params: cleanParams({
      estado,
      desde,
      hasta,
      curso_id
    })
  });

  return response.data;
};

export const getReinforcementById = async (id) => {
  const response = await api.get(`/reinforcements/${id}`);
  return response.data;
};

export const getReinforcementCandidates = async ({
  aula_origen_id,
  curso_id,
  periodo_id,
  bimestre
}) => {
  const response = await api.get('/reinforcements/candidates', {
    params: cleanParams({
      aula_origen_id,
      curso_id,
      periodo_id,
      bimestre
    })
  });

  return response.data;
};

export const getAvailableReinforcementTeachers = async ({
  curso_id,
  fecha,
  hora_inicio,
  hora_fin
}) => {
  const response = await api.get('/reinforcements/available-teachers', {
    params: cleanParams({
      curso_id,
      fecha,
      hora_inicio,
      hora_fin
    })
  });

  return response.data;
};

export const getAvailableReinforcementClassrooms = async ({
  turno,
  fecha,
  hora_inicio,
  hora_fin
}) => {
  const response = await api.get('/reinforcements/available-classrooms', {
    params: cleanParams({
      turno,
      fecha,
      hora_inicio,
      hora_fin
    })
  });

  return response.data;
};

export const createReinforcement = async (payload) => {
  const response = await api.post('/reinforcements', payload);
  return response.data;
};

export const updateReinforcement = async ({
  id,
  payload
}) => {
  const response = await api.put(`/reinforcements/${id}`, payload);
  return response.data;
};

export const cancelReinforcement = async ({
  id,
  motivo
}) => {
  const response = await api.patch(`/reinforcements/${id}/cancel`, {
    motivo
  });

  return response.data;
};

export const completeReinforcement = async ({
  id,
  observacion
}) => {
  const response = await api.patch(`/reinforcements/${id}/complete`, {
    observacion
  });

  return response.data;
};

export const respondReinforcementAssignment = async ({
  id,
  estado,
  respuesta
}) => {
  const response = await api.patch(`/reinforcements/assignments/${id}/respond`, {
    estado,
    respuesta
  });

  return response.data;
};

export const saveReinforcementAttendance = async ({
  id,
  asistencias
}) => {
  const response = await api.put(`/reinforcements/${id}/attendance`, {
    asistencias
  });

  return response.data;
};