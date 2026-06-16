import api from './api';

export const BIMESTERS = [
  { value: 'B1', label: 'Bimestre 1' },
  { value: 'B2', label: 'Bimestre 2' },
  { value: 'B3', label: 'Bimestre 3' },
  { value: 'B4', label: 'Bimestre 4' }
];

export const GRADE_SCALE = [
  { value: 'AD', label: 'AD - Logro destacado' },
  { value: 'A', label: 'A - Logro esperado' },
  { value: 'B', label: 'B - En proceso' },
  { value: 'C', label: 'C - En inicio' }
];

export const getAcademicPeriodsForGrades = async () => {
  const response = await api.get('/academic-periods');
  return response.data;
};

export const getTeacherAssignmentsForGrades = async () => {
  const response = await api.get('/teacher-courses');
  return response.data;
};

export const getMyTeacherAssignmentsForGrades = async () => {
  const response = await api.get('/teacher-courses/me');
  return response.data;
};

export const getStudentsForGrades = async ({ aulaId, periodoId }) => {
  const response = await api.get(`/grades-notes/classroom/${aulaId}/students`, {
    params: {
      periodo_id: periodoId || undefined
    }
  });

  return response.data;
};

export const getClassroomCourseBimesterGrades = async ({
  aulaId,
  cursoId,
  bimestre,
  periodoId
}) => {
  const response = await api.get(
    `/grades-notes/classroom/${aulaId}/course/${cursoId}/bimester/${bimestre}`,
    {
      params: {
        periodo_id: periodoId || undefined
      }
    }
  );

  return response.data;
};

export const saveBimesterGrades = async (payload) => {
  const normalizedGrades = (payload.notas || payload.grades || []).map((item) => ({
    estudiante_id: Number(item.estudiante_id),
    nota: item.nota || item.calificacion,
    calificacion: item.nota || item.calificacion,
    comentario: item.comentario || item.observacion || null,
    observacion: item.observacion || item.comentario || null
  }));

  const body = {
    aula_id: Number(payload.aula_id),
    curso_id: Number(payload.curso_id),
    bimestre: payload.bimestre,
    periodo_id: Number(payload.periodo_id),

    // Enviamos ambos nombres para evitar incompatibilidad con el backend actual.
    notas: normalizedGrades,
    grades: normalizedGrades,
    calificaciones: normalizedGrades
  };

  const response = await api.post('/grades-notes', body);
  return response.data;
};

export const getStudentGrades = async ({ studentId, periodoId }) => {
  const response = await api.get(`/grades-notes/student/${studentId}`, {
    params: {
      periodo_id: periodoId || undefined
    }
  });

  return response.data;
};

export const getMyGrades = async ({ periodoId } = {}) => {
  const response = await api.get('/grades-notes/me', {
    params: {
      periodo_id: periodoId || undefined
    }
  });

  return response.data;
};

export const getClassroomCourseSummary = async ({
  aulaId,
  cursoId,
  periodoId
}) => {
  const response = await api.get(
    `/grades-notes/classroom/${aulaId}/course/${cursoId}/summary`,
    {
      params: {
        periodo_id: periodoId || undefined
      }
    }
  );

  return response.data;
};

export const getStudentsAtRisk = async ({ aulaId, periodoId }) => {
  const response = await api.get(`/grades-notes/risk/classroom/${aulaId}`, {
    params: {
      periodo_id: periodoId || undefined
    }
  });

  return response.data;
};