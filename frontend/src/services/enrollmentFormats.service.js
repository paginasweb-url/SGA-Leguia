import api from './api';

const getFileNameFromDisposition = (disposition, fallbackFileName) => {
  if (!disposition) return fallbackFileName;

  const match = disposition.match(/filename="?([^"]+)"?/);

  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return fallbackFileName;
};

export const getPublicEnrollmentFormats = async () => {
  const response = await api.get('/enrollment-formats/public');
  return response.data;
};

export const getEnrollmentFormats = async ({
  estado,
  usuario,
  page = 1,
  limit = 50
} = {}) => {
  const response = await api.get('/enrollment-formats', {
    params: {
      estado: estado || undefined,
      usuario: usuario || undefined,
      page,
      limit
    }
  });

  return response.data;
};

export const getEnrollmentFormatById = async (id) => {
  const response = await api.get(`/enrollment-formats/${id}`);
  return response.data;
};

export const createEnrollmentFormat = async ({
  titulo,
  descripcion,
  archivo
}) => {
  const formData = new FormData();

  formData.append('titulo', titulo);
  formData.append('descripcion', descripcion || '');
  formData.append('archivo', archivo);

  const response = await api.post('/enrollment-formats', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const updateEnrollmentFormat = async ({
  id,
  titulo,
  descripcion
}) => {
  const response = await api.patch(`/enrollment-formats/${id}`, {
    titulo,
    descripcion
  });

  return response.data;
};

export const updateEnrollmentFormatStatus = async ({
  id,
  estado
}) => {
  const response = await api.patch(`/enrollment-formats/${id}/status`, {
    estado
  });

  return response.data;
};

export const viewEnrollmentFormat = async ({
  id
}) => {
  const response = await api.get(`/enrollment-formats/${id}/download`, {
    responseType: 'blob'
  });

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/pdf'
  });

  const url = window.URL.createObjectURL(blob);

  window.open(url, '_blank', 'noopener,noreferrer');

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);
};

export const downloadEnrollmentFormat = async ({
  id,
  fallbackFileName = 'formato_matricula.pdf'
}) => {
  const response = await api.get(`/enrollment-formats/${id}/download`, {
    responseType: 'blob'
  });

  const fileName = getFileNameFromDisposition(
    response.headers['content-disposition'],
    fallbackFileName
  );

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/pdf'
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

export const getEnrollmentFormatDownloadUrl = (id) => {
  return `${api.defaults.baseURL}/enrollment-formats/${id}/download`;
};