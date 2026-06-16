import api from './api';

export const getEnrollmentPublicOptions = async () => {
  const response = await api.get('/enrollment-requests/public-options');
  return response.data;
};

export const createEnrollmentRequest = async (payload) => {
  const response = await api.post('/enrollment-requests', payload);
  return response.data;
};

export const uploadEnrollmentRequestDocument = async ({
  requestId,
  tipo_documento,
  file
}) => {
  const formData = new FormData();

  formData.append('tipo_documento', tipo_documento);
  formData.append('documento', file);

  const response = await api.post(
    `/enrollment-requests/${requestId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};

export const trackEnrollmentRequest = async (payload) => {
  const response = await api.post('/enrollment-requests/track', payload);
  return response.data;
};

export const getEnrollmentRequests = async () => {
  const response = await api.get('/enrollment-requests');
  return response.data;
};

export const getEnrollmentRequestById = async (id) => {
  const response = await api.get(`/enrollment-requests/${id}`);
  return response.data;
};

export const getEnrollmentRequestDocuments = async (id) => {
  const response = await api.get(`/enrollment-requests/${id}/documents`);
  return response.data;
};

export const getAvailableClassrooms = async ({
  grado_id,
  turno,
  periodo_id
}) => {
  const response = await api.get('/enrollment-requests/available-classrooms', {
    params: {
      grado_id,
      turno,
      periodo_id
    }
  });

  return response.data;
};

export const updateEnrollmentRequestStatus = async ({
  id,
  estado,
  observacion,
  aula_id
}) => {
  const payload = {
    estado
  };

  if (observacion !== undefined) {
    payload.observacion = observacion;
  }

  if (aula_id !== undefined) {
    payload.aula_id = aula_id;
  }

  const response = await api.patch(`/enrollment-requests/${id}/status`, payload);
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

export const viewEnrollmentRequestDocument = async ({
  requestId,
  documentId
}) => {
  const response = await api.get(
    `/enrollment-requests/${requestId}/documents/${documentId}/download`,
    {
      params: {
        mode: 'inline'
      },
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

export const downloadEnrollmentRequestDocument = async ({
  requestId,
  documentId,
  fallbackFileName = 'documento'
}) => {
  const response = await api.get(
    `/enrollment-requests/${requestId}/documents/${documentId}/download`,
    {
      params: {
        mode: 'download'
      },
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