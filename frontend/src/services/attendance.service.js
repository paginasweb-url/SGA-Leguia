import api from './api';

export const getAttendanceClassrooms = async () => {
  const response = await api.get('/attendance/classrooms');
  return response.data;
};

export const getClassroomStudentsForAttendance = async (aulaId) => {
  const response = await api.get(`/attendance/classroom/${aulaId}/students`);
  return response.data;
};

export const getClassroomAttendanceByDate = async ({ aulaId, fecha }) => {
  const response = await api.get(`/attendance/classroom/${aulaId}`, {
    params: { fecha }
  });

  return response.data;
};

export const registerClassroomAttendance = async (payload) => {
  const response = await api.post('/attendance/classroom', payload);
  return response.data;
};

export const getClassroomAttendanceSummary = async ({
  aulaId,
  fecha,
  fechaInicio,
  fechaFin
}) => {
  const response = await api.get(`/attendance/classroom/${aulaId}/summary`, {
    params: {
      fecha,
      fechaInicio,
      fechaFin
    }
  });

  return response.data;
};

export const getStudentAttendance = async (studentId) => {
  const response = await api.get(`/attendance/student/${studentId}`);
  return response.data;
};

export const getMyAttendance = async (params = {}) => {
  const response = await api.get('/attendance/me', {
    params
  });

  return response.data;
};

export const getClassroomAttendanceByRange = async ({
  aulaId,
  fechaInicio,
  fechaFin
}) => {
  const response = await api.get(`/attendance/classroom/${aulaId}/range`, {
    params: {
      fechaInicio,
      fechaFin
    }
  });

  return response.data;
};

export const createAttendanceJustification = async ({
  asistenciaId,
  motivo,
  documento
}) => {
  const formData = new FormData();

  formData.append('asistencia_id', asistenciaId);
  formData.append('motivo', motivo);

  if (documento) {
    formData.append('documento', documento);
  }

  const response = await api.post(
    '/attendance/justifications',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};

export const getAttendanceJustifications = async () => {
  const response = await api.get('/attendance/justifications');
  return response.data;
};

export const reviewAttendanceJustification = async ({
  id,
  estado,
  respuesta
}) => {
  const response = await api.patch(
    `/attendance/justifications/${id}/review`,
    {
      estado,
      respuesta
    }
  );

  return response.data;
};

const getFileNameFromDisposition = (disposition, fallbackFileName) => {
  if (!disposition) return fallbackFileName;

  const match = disposition.match(/filename="?([^"]+)"?/);

  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return fallbackFileName;
};

export const viewAttendanceJustificationDocument = async (id) => {
  const response = await api.get(
    `/attendance/justifications/${id}/download`,
    {
      responseType: 'blob'
    }
  );

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });

  const url = window.URL.createObjectURL(blob);

  window.open(url, '_blank', 'noopener,noreferrer');

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);
};

export const downloadAttendanceJustificationDocument = async ({
  id,
  fallbackFileName = 'justificacion'
}) => {
  const response = await api.get(
    `/attendance/justifications/${id}/download`,
    {
      responseType: 'blob'
    }
  );

  const fileName = getFileNameFromDisposition(
    response.headers['content-disposition'],
    fallbackFileName
  );

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getAttendanceAlerts = async (estado = 'activa') => {
  const params = {};

  if (estado && estado !== 'todos') {
    params.estado = estado;
  }

  const response = await api.get('/attendance/alerts', {
    params
  });

  return response.data;
};

export const resolveAttendanceAlert = async ({
  id,
  observacion
}) => {
  const response = await api.patch(
    `/attendance/alerts/${id}/resolve`,
    {
      observacion
    }
  );

  return response.data;
};