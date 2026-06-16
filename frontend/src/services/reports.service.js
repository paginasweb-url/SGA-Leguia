import api from './api';

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getDashboardReport = async () => {
  const response = await api.get('/reports/dashboard');
  return response.data;
};

export const getEnrollmentReport = async () => {
  const response = await api.get('/reports/enrollments');
  return response.data;
};

export const exportEnrollmentReport = async () => {
  const response = await api.get('/reports/enrollments/export', {
    responseType: 'blob'
  });

  downloadBlob(response.data, 'reporte_matriculas.xlsx');
};

export const getAttendanceReport = async ({ fechaInicio, fechaFin } = {}) => {
  const response = await api.get('/reports/attendance', {
    params: {
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined
    }
  });

  return response.data;
};

export const exportAttendanceDetailReport = async ({ fechaInicio, fechaFin } = {}) => {
  const response = await api.get('/reports/attendance/export-detail', {
    params: {
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined
    },
    responseType: 'blob'
  });

  downloadBlob(response.data, 'reporte_asistencia_detallada.xlsx');
};

export const getGradesReport = async ({ bimestre }) => {
  const response = await api.get('/reports/grades', {
    params: { bimestre }
  });

  return response.data;
};

export const exportGradesReport = async ({ bimestre }) => {
  const response = await api.get('/reports/grades/export', {
    params: { bimestre },
    responseType: 'blob'
  });

  downloadBlob(response.data, `reporte_notas_${bimestre}.xlsx`);
};

export const getRiskStudentsReport = async ({ bimestre }) => {
  const response = await api.get('/reports/risk-students', {
    params: { bimestre }
  });

  return response.data;
};

export const exportRiskStudentsReport = async ({ bimestre }) => {
  const response = await api.get('/reports/risk-students/export', {
    params: { bimestre },
    responseType: 'blob'
  });

  downloadBlob(response.data, `reporte_estudiantes_riesgo_${bimestre}.xlsx`);
};

export const getAnnouncementsReport = async () => {
  const response = await api.get('/reports/announcements');
  return response.data;
};

export const exportAnnouncementsReport = async () => {
  const response = await api.get('/reports/announcements/export', {
    responseType: 'blob'
  });

  downloadBlob(response.data, 'reporte_comunicados.xlsx');
};