import pool from '../config/db.js';

export const getDashboardStats = async () => {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM estudiantes) AS total_estudiantes,
      (SELECT COUNT(*) FROM estudiantes WHERE estado = 'activo') AS estudiantes_activos,
      (SELECT COUNT(*) FROM estudiantes WHERE estado = 'inactivo') AS estudiantes_inactivos,
      (SELECT COUNT(*) FROM docentes) AS total_docentes,
      (SELECT COUNT(*) FROM users) AS total_usuarios
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

export const getTeacherDashboardByUserId = async (userId) => {
  const teacherResult = await pool.query(
    `
    SELECT
      d.id AS docente_id,
      d.especialidad,
      u.id AS user_id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.estado
    FROM docentes d
    INNER JOIN users u ON d.user_id = u.id
    WHERE d.user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  const teacher = teacherResult.rows[0];

  if (!teacher) {
    return null;
  }

  const teacherId = teacher.docente_id;

  const summaryResult = await pool.query(
    `
    SELECT
      (
        SELECT COUNT(DISTINCT curso_id)::int
        FROM docente_curso
        WHERE docente_id = $1
      ) AS total_cursos,
      (
        SELECT COUNT(DISTINCT aula_id)::int
        FROM docente_curso
        WHERE docente_id = $1
      ) AS total_aulas,
      (
        SELECT COUNT(DISTINCT m.estudiante_id)::int
        FROM docente_curso dc
        INNER JOIN matriculas m
          ON m.aula_id = dc.aula_id
          AND m.estado = 'aprobado'
        WHERE dc.docente_id = $1
      ) AS total_estudiantes,
      (
        SELECT COUNT(*)::int
        FROM horarios
        WHERE docente_id = $1
      ) AS total_horarios,
      (
        SELECT COUNT(*)::int
        FROM notas n
        INNER JOIN docente_curso dc
          ON dc.aula_id = n.aula_id
          AND dc.curso_id = n.curso_id
        WHERE dc.docente_id = $1
      ) AS total_notas_registradas,
      (
        SELECT COUNT(DISTINCT n.estudiante_id)::int
        FROM notas n
        INNER JOIN docente_curso dc
          ON dc.aula_id = n.aula_id
          AND dc.curso_id = n.curso_id
        WHERE dc.docente_id = $1
          AND n.nota = 'C'
      ) AS estudiantes_en_riesgo
    `,
    [teacherId]
  );

  const assignmentsResult = await pool.query(
    `
    SELECT
      dc.id,
      dc.docente_id,
      dc.curso_id,
      c.nombre AS curso,
      dc.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      dc.created_at
    FROM docente_curso dc
    INNER JOIN cursos c ON dc.curso_id = c.id
    INNER JOIN aulas a ON dc.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE dc.docente_id = $1
    ORDER BY c.nombre ASC, g.nombre ASC, s.nombre ASC
    `,
    [teacherId]
  );

  const schedulesResult = await pool.query(
    `
    SELECT
      h.id,
      h.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      h.curso_id,
      c.nombre AS curso,
      h.dia_semana,
      h.hora_inicio,
      h.hora_fin
    FROM horarios h
    INNER JOIN aulas a ON h.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN cursos c ON h.curso_id = c.id
    WHERE h.docente_id = $1
    ORDER BY
      CASE h.dia_semana
        WHEN 'Lunes' THEN 1
        WHEN 'Martes' THEN 2
        WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4
        WHEN 'Viernes' THEN 5
        ELSE 6
      END,
      h.hora_inicio ASC
    LIMIT 10
    `,
    [teacherId]
  );

  const studentsResult = await pool.query(
    `
    SELECT DISTINCT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM docente_curso dc
    INNER JOIN matriculas m
      ON m.aula_id = dc.aula_id
      AND m.estado = 'aprobado'
    INNER JOIN estudiantes e ON m.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN aulas a ON m.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE dc.docente_id = $1
    ORDER BY u.apellidos ASC, u.nombres ASC
    LIMIT 10
    `,
    [teacherId]
  );

  const riskResult = await pool.query(
    `
    SELECT
      n.id AS nota_id,
      n.estudiante_id,
      u.nombres,
      u.apellidos,
      c.nombre AS curso,
      n.bimestre,
      n.nota,
      n.comentario,
      n.created_at AS nota_created_at,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM notas n
    INNER JOIN docente_curso dc
      ON dc.aula_id = n.aula_id
      AND dc.curso_id = n.curso_id
    INNER JOIN estudiantes e ON n.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE dc.docente_id = $1
      AND n.nota = 'C'
    ORDER BY n.created_at DESC
    LIMIT 10
    `,
    [teacherId]
  );

  const announcementsResult = await pool.query(
    `
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
      OR c.destinatario_tipo = 'docentes'
      OR (
        c.destinatario_tipo = 'aula'
        AND c.aula_id IN (
          SELECT DISTINCT aula_id
          FROM docente_curso
          WHERE docente_id = $2
        )
      )
    ORDER BY c.fecha DESC
    LIMIT 5
    `,
    [userId, teacherId]
  );

  return {
    teacher,
    summary: summaryResult.rows[0],
    assignments: assignmentsResult.rows,
    schedules: schedulesResult.rows,
    students: studentsResult.rows,
    risk_students: riskResult.rows,
    announcements: announcementsResult.rows
  };
};

export const getAuxiliaryDashboardByUserId = async (userId) => {
  const userResult = await pool.query(
    `
    SELECT
      u.id AS user_id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.estado,
      r.nombre AS rol
    FROM users u
    INNER JOIN roles r ON u.rol_id = r.id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  const user = userResult.rows[0];

  if (!user) {
    return null;
  }

  const summaryResult = await pool.query(
    `
    SELECT
      (
        SELECT COUNT(*)::int
        FROM aulas
      ) AS total_aulas,
      (
        SELECT COUNT(DISTINCT estudiante_id)::int
        FROM matriculas
        WHERE estado = 'aprobado'
      ) AS estudiantes_matriculados,
      (
        SELECT COUNT(*)::int
        FROM asistencias
        WHERE fecha = CURRENT_DATE
      ) AS asistencias_hoy,
      (
        SELECT COUNT(*)::int
        FROM asistencias
        WHERE fecha = CURRENT_DATE
          AND LOWER(estado) IN ('falta', 'faltó', 'ausente')
      ) AS faltas_hoy,
      (
        SELECT COUNT(*)::int
        FROM asistencias
        WHERE fecha = CURRENT_DATE
          AND LOWER(estado) IN ('tarde', 'tardanza')
      ) AS tardanzas_hoy,
      (
        SELECT COUNT(*)::int
        FROM asistencias
        WHERE fecha = CURRENT_DATE
          AND LOWER(estado) IN ('justificado', 'justificada')
      ) AS justificados_hoy
    `
  );

  const attendanceTodayResult = await pool.query(
    `
    SELECT
      estado,
      COUNT(*)::int AS total
    FROM asistencias
    WHERE fecha = CURRENT_DATE
    GROUP BY estado
    ORDER BY estado ASC
    `
  );

  const recentAttendanceResult = await pool.query(
    `
    SELECT
      a.id,
      a.fecha,
      a.estado,
      a.observacion,
      e.id AS estudiante_id,
      u.nombres,
      u.apellidos,
      u.dni,
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno
    FROM asistencias a
    INNER JOIN estudiantes e ON a.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN aulas au ON a.aula_id = au.id
    INNER JOIN grados g ON au.grado_id = g.id
    INNER JOIN secciones s ON au.seccion_id = s.id
    ORDER BY a.fecha DESC, a.id DESC
    LIMIT 10
    `
  );

  const classroomSummaryResult = await pool.query(
    `
    SELECT
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno,
      COUNT(a.id)::int AS registros_hoy
    FROM aulas au
    INNER JOIN grados g ON au.grado_id = g.id
    INNER JOIN secciones s ON au.seccion_id = s.id
    LEFT JOIN asistencias a
      ON a.aula_id = au.id
      AND a.fecha = CURRENT_DATE
    GROUP BY au.id, g.nombre, s.nombre, au.turno
    ORDER BY g.nombre ASC, s.nombre ASC, au.turno ASC
    LIMIT 10
    `
  );

  const announcementsResult = await pool.query(
    `
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
      OR c.destinatario_tipo = 'auxiliares'
    ORDER BY c.fecha DESC
    LIMIT 5
    `,
    [userId]
  );

  return {
    user,
    summary: summaryResult.rows[0],
    attendance_today: attendanceTodayResult.rows,
    recent_attendance: recentAttendanceResult.rows,
    classroom_summary: classroomSummaryResult.rows,
    announcements: announcementsResult.rows
  };
};