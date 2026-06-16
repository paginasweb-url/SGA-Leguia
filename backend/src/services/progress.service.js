import pool from '../config/db.js';

const roleToTargetType = {
  Director: 'directores',
  Administrativo: 'administrativos',
  Auxiliar: 'auxiliares',
  Docente: 'docentes',
  Estudiante: 'estudiantes',
  Apoderado: 'apoderados'
};

export const getStudentByUserId = async (userId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.user_id,
      e.codigo_estudiante,
      e.fecha_nacimiento,
      e.direccion,
      e.estado,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo
    FROM estudiantes e
    INNER JOIN users u ON e.user_id = u.id
    WHERE e.user_id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

export const getGuardianChildren = async (guardianUserId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.user_id,
      e.codigo_estudiante,
      e.fecha_nacimiento,
      e.direccion,
      e.estado,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      ea.parentesco
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea ON ap.id = ea.apoderado_id
    INNER JOIN estudiantes e ON ea.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    WHERE ap.user_id = $1
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [guardianUserId]);
  return result.rows;
};

export const guardianCanAccessStudent = async (guardianUserId, studentId) => {
  const query = `
    SELECT ea.id
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea ON ap.id = ea.apoderado_id
    WHERE ap.user_id = $1
      AND ea.estudiante_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [guardianUserId, studentId]);
  return result.rows.length > 0;
};

export const studentOwnsProfile = async (userId, studentId) => {
  const query = `
    SELECT id
    FROM estudiantes
    WHERE user_id = $1
      AND id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [userId, studentId]);
  return result.rows.length > 0;
};

export const teacherCanAccessStudent = async (teacherUserId, studentId) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    INNER JOIN matriculas m
      ON m.aula_id = dc.aula_id
      AND m.estado = 'aprobado'
    WHERE d.user_id = $1
      AND m.estudiante_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [teacherUserId, studentId]);
  return result.rows.length > 0;
};

export const getStudentProfile = async (studentId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      e.fecha_nacimiento,
      e.direccion,
      e.estado,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      m.id AS matricula_id,
      m.periodo_id,
      p.nombre AS periodo,
      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM estudiantes e
    INNER JOIN users u ON e.user_id = u.id
    LEFT JOIN matriculas m
      ON e.id = m.estudiante_id
      AND m.estado = 'aprobado'
    LEFT JOIN periodos_academicos p ON m.periodo_id = p.id
    LEFT JOIN aulas a ON m.aula_id = a.id
    LEFT JOIN grados g ON a.grado_id = g.id
    LEFT JOIN secciones s ON a.seccion_id = s.id
    WHERE e.id = $1
    ORDER BY m.created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows[0];
};

export const getStudentGradesProgress = async (studentId) => {
  const query = `
    SELECT
      n.id,
      n.bimestre,
      n.nota,
      n.comentario,
      c.id AS curso_id,
      c.nombre AS curso,
      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      n.created_at
    FROM notas n
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE n.estudiante_id = $1
    ORDER BY n.bimestre ASC, c.nombre ASC
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getStudentAttendanceSummaryProgress = async (studentId) => {
  const query = `
    SELECT
      estado,
      COUNT(*)::int AS total
    FROM asistencias
    WHERE estudiante_id = $1
    GROUP BY estado
    ORDER BY estado ASC
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getStudentRecentAttendanceProgress = async (studentId) => {
  const query = `
    SELECT
      a.id,
      a.fecha,
      a.estado,
      a.observacion,
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno
    FROM asistencias a
    LEFT JOIN aulas au ON a.aula_id = au.id
    LEFT JOIN grados g ON au.grado_id = g.id
    LEFT JOIN secciones s ON au.seccion_id = s.id
    WHERE a.estudiante_id = $1
    ORDER BY a.fecha DESC
    LIMIT 10
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getStudentRiskAlerts = async (studentId) => {
  const query = `
    SELECT
      n.id,
      n.bimestre,
      n.nota,
      n.comentario,
      c.id AS curso_id,
      c.nombre AS curso,
      a.turno
    FROM notas n
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    WHERE n.estudiante_id = $1
      AND n.nota = 'C'
    ORDER BY n.bimestre ASC, c.nombre ASC
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getReinforcementSuggestions = async (studentId) => {
  const query = `
    SELECT DISTINCT
      c.id AS curso_id,
      c.nombre AS curso,
      a.turno,
      n.bimestre,
      n.comentario
    FROM notas n
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    WHERE n.estudiante_id = $1
      AND n.nota = 'C'
    ORDER BY c.nombre ASC
  `;

  const result = await pool.query(query, [studentId]);

  return result.rows.map((item) => ({
    curso_id: item.curso_id,
    curso: item.curso,
    bimestre: item.bimestre,
    motivo: item.comentario || 'El estudiante presenta bajo rendimiento en el curso.',
    sugerencia: `Se recomienda reforzamiento académico en ${item.curso}.`,
    turno_sugerido: item.turno === 'Mañana' ? 'Tarde' : 'Mañana',
    obligatorio: false
  }));
};

export const getAnnouncementsForProgress = async (userId, rol) => {
  const destinatarioTipo = roleToTargetType[rol] || rol.toLowerCase();

  const query = `
    SELECT
      c.id,
      c.titulo,
      c.contenido,
      c.destinatario_tipo,
      c.aula_id,
      c.fecha,
      cl.leido,
      cl.fecha_lectura
    FROM comunicados c
    LEFT JOIN comunicado_lecturas cl
      ON cl.comunicado_id = c.id
      AND cl.user_id = $1
    WHERE
      c.destinatario_tipo = 'general'
      OR c.destinatario_tipo = $2
      OR (
        c.destinatario_tipo = 'aula'
        AND c.aula_id IN (
          SELECT m.aula_id
          FROM matriculas m
          INNER JOIN estudiantes e ON m.estudiante_id = e.id
          WHERE e.user_id = $1
            AND m.estado = 'aprobado'
        )
      )
      OR (
        c.destinatario_tipo = 'aula'
        AND c.aula_id IN (
          SELECT m.aula_id
          FROM matriculas m
          INNER JOIN estudiante_apoderado ea ON m.estudiante_id = ea.estudiante_id
          INNER JOIN apoderados ap ON ea.apoderado_id = ap.id
          WHERE ap.user_id = $1
            AND m.estado = 'aprobado'
        )
      )
    ORDER BY c.fecha DESC
  `;

  const result = await pool.query(query, [userId, destinatarioTipo]);
  return result.rows;
};

export const buildStudentProgress = async (studentId) => {
  const student = await getStudentProfile(studentId);

  if (!student) {
    return null;
  }

  const grades = await getStudentGradesProgress(studentId);
  const attendanceSummary = await getStudentAttendanceSummaryProgress(studentId);
  const attendanceRecent = await getStudentRecentAttendanceProgress(studentId);
  const riskAlerts = await getStudentRiskAlerts(studentId);
  const reinforcementSuggestions = await getReinforcementSuggestions(studentId);

  return {
    student,
    grades,
    attendance_summary: attendanceSummary,
    attendance_recent: attendanceRecent,
    risk_alerts: riskAlerts,
    reinforcement_suggestions: reinforcementSuggestions
  };
};