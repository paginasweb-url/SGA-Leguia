import pool from '../config/db.js';

export const getDashboardReport = async () => {
  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM estudiantes WHERE estado = 'activo') AS total_estudiantes,
      (SELECT COUNT(*)::int FROM docentes d INNER JOIN users u ON d.user_id = u.id WHERE u.estado = 'activo') AS total_docentes,
      (SELECT COUNT(*)::int FROM aulas) AS total_aulas,
      (SELECT COUNT(*)::int FROM solicitudes_matricula WHERE estado = 'pendiente') AS solicitudes_pendientes,
      (SELECT COUNT(*)::int FROM solicitudes_matricula WHERE estado = 'observado') AS solicitudes_observadas,
      (SELECT COUNT(*)::int FROM asistencias WHERE estado = 'falta') AS total_faltas,
      (SELECT COUNT(*)::int FROM notas WHERE nota = 'C') AS estudiantes_en_riesgo
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

export const getEnrollmentReport = async () => {
  const query = `
    SELECT
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      COUNT(m.id)::int AS total_matriculados
    FROM matriculas m
    INNER JOIN aulas a ON m.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE m.estado = 'aprobado'
    GROUP BY g.nombre, s.nombre, a.turno
    ORDER BY g.nombre, s.nombre
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getAttendanceReport = async (fechaInicio, fechaFin) => {
  let query = `
    SELECT
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno,
      a.estado,
      COUNT(*)::int AS total
    FROM asistencias a
    INNER JOIN aulas au ON a.aula_id = au.id
    INNER JOIN grados g ON au.grado_id = g.id
    INNER JOIN secciones s ON au.seccion_id = s.id
    WHERE 1 = 1
  `;

  const values = [];

  if (fechaInicio && fechaFin) {
    values.push(fechaInicio, fechaFin);
    query += ` AND a.fecha BETWEEN $1 AND $2`;
  }

  query += `
    GROUP BY g.nombre, s.nombre, au.turno, a.estado
    ORDER BY g.nombre, s.nombre, a.estado
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getGradesReport = async (bimestre) => {
  const query = `
    SELECT
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      c.nombre AS curso,
      n.nota,
      COUNT(*)::int AS total
    FROM notas n
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN cursos c ON n.curso_id = c.id
    WHERE n.bimestre = $1
    GROUP BY g.nombre, s.nombre, a.turno, c.nombre, n.nota
    ORDER BY g.nombre, s.nombre, c.nombre, n.nota
  `;

  const result = await pool.query(query, [bimestre]);
  return result.rows;
};

export const getRiskStudentsReport = async (bimestre) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      c.nombre AS curso,
      n.bimestre,
      n.nota,
      n.comentario
    FROM notas n
    INNER JOIN estudiantes e ON n.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN cursos c ON n.curso_id = c.id
    WHERE n.nota = 'C'
      AND n.bimestre = $1
    ORDER BY g.nombre, s.nombre, u.apellidos
  `;

  const result = await pool.query(query, [bimestre]);
  return result.rows;
};

export const getAnnouncementsReport = async () => {
  const query = `
    SELECT
      c.id,
      c.titulo,
      c.destinatario_tipo,
      c.fecha,
      COUNT(cl.id)::int AS confirmaciones,
      COUNT(CASE WHEN cl.leido = true THEN 1 END)::int AS leidos
    FROM comunicados c
    LEFT JOIN comunicado_lecturas cl ON c.id = cl.comunicado_id
    GROUP BY c.id, c.titulo, c.destinatario_tipo, c.fecha
    ORDER BY c.fecha DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getAttendanceExportDetail = async ({
  fechaInicio,
  fechaFin
}) => {
  const query = `
    SELECT
      a.fecha,
      e.codigo_estudiante,
      CONCAT(u.nombres, ' ', u.apellidos) AS estudiante,
      u.dni,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno,
      a.estado,
      a.observacion
    FROM asistencias a
    INNER JOIN estudiantes e ON a.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN aulas au ON a.aula_id = au.id
    INNER JOIN grados g ON au.grado_id = g.id
    INNER JOIN secciones s ON au.seccion_id = s.id
    WHERE a.fecha BETWEEN $1 AND $2
    ORDER BY a.fecha ASC, g.nombre ASC, s.nombre ASC, u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [fechaInicio, fechaFin]);
  return result.rows;
};