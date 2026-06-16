import pool from '../config/db.js';

export const getStudentsByClassroom = async (aulaId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      m.aula_id,
      m.periodo_id
    FROM matriculas m
    INNER JOIN estudiantes e
      ON m.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    WHERE m.aula_id = $1
      AND m.estado = 'aprobado'
      AND e.estado = 'activo'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [aulaId]);
  return result.rows;
};

export const saveClassroomAttendance = async ({ aula_id, fecha, asistencias }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const allowedStates = ['presente', 'tarde', 'falta', 'justificado'];

    for (const item of asistencias) {
      const { estudiante_id, estado, observacion } = item;

      if (!allowedStates.includes(estado)) {
        throw new Error(`Estado no válido para estudiante ${estudiante_id}`);
      }

      if (estado === 'justificado' && !observacion) {
        throw new Error(`Debe registrar observación para la justificación del estudiante ${estudiante_id}`);
      }

      const enrollmentCheck = await client.query(
        `
        SELECT id
        FROM matriculas
        WHERE estudiante_id = $1
          AND aula_id = $2
          AND estado = 'aprobado'
        LIMIT 1
        `,
        [estudiante_id, aula_id]
      );

      if (enrollmentCheck.rows.length === 0) {
        throw new Error(`El estudiante ${estudiante_id} no pertenece al aula indicada`);
      }

      await client.query(
        `
        INSERT INTO asistencias (
          estudiante_id,
          aula_id,
          horario_id,
          fecha,
          estado,
          observacion,
          created_at
        )
        VALUES ($1,$2,NULL,$3,$4,$5,NOW())
        ON CONFLICT (estudiante_id, fecha, aula_id)
        DO UPDATE SET
          estado = EXCLUDED.estado,
          observacion = EXCLUDED.observacion
        `,
        [
          estudiante_id,
          aula_id,
          fecha,
          estado,
          observacion || null
        ]
      );
    }

    await client.query('COMMIT');

    return {
      aula_id,
      fecha,
      total_registros: asistencias.length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getAttendanceByClassroomAndDate = async (aulaId, fecha) => {
  const query = `
    SELECT
      a.id,
      a.fecha,
      a.estado,
      a.observacion,
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno
    FROM asistencias a
    INNER JOIN estudiantes e
      ON a.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    INNER JOIN aulas au
      ON a.aula_id = au.id
    INNER JOIN grados g
      ON au.grado_id = g.id
    INNER JOIN secciones s
      ON au.seccion_id = s.id
    WHERE a.aula_id = $1
      AND a.fecha = $2
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [aulaId, fecha]);
  return result.rows;
};

export const getAttendanceByStudent = async (studentId) => {
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
    INNER JOIN aulas au
      ON a.aula_id = au.id
    INNER JOIN grados g
      ON au.grado_id = g.id
    INNER JOIN secciones s
      ON au.seccion_id = s.id
    WHERE a.estudiante_id = $1
    ORDER BY a.fecha DESC
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getAttendanceSummaryByClassroom = async (
  aulaId,
  fechaInicio,
  fechaFin
) => {
  let query = `
    SELECT
      estado,
      COUNT(*)::int AS total
    FROM asistencias
    WHERE aula_id = $1
  `;

  const values = [aulaId];

  if (fechaInicio && fechaFin) {
    query += `
      AND fecha BETWEEN $2 AND $3
    `;
    values.push(fechaInicio, fechaFin);
  } else if (fechaInicio) {
    query += `
      AND fecha = $2
    `;
    values.push(fechaInicio);
  }

  query += `
    GROUP BY estado
    ORDER BY estado ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getActiveClassroomsForAttendance = async () => {
  const query = `
    SELECT
      au.id,
      au.grado_id,
      g.nombre AS grado,
      au.seccion_id,
      s.nombre AS seccion,
      au.turno,
      au.capacidad,
      au.estado,
      COUNT(m.id)::int AS matriculados
    FROM aulas au
    INNER JOIN grados g ON au.grado_id = g.id
    INNER JOIN secciones s ON au.seccion_id = s.id
    LEFT JOIN matriculas m
      ON m.aula_id = au.id
      AND m.estado = 'aprobado'
    WHERE au.estado = 'activo'
    GROUP BY
      au.id,
      au.grado_id,
      g.nombre,
      au.seccion_id,
      s.nombre,
      au.turno,
      au.capacidad,
      au.estado
    ORDER BY au.grado_id ASC, s.nombre ASC, au.turno ASC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getAttendanceForUser = async ({ userId, rol }) => {
  if (rol === 'Estudiante') {
    const query = `
      SELECT
        e.id AS estudiante_id,
        ue.nombres || ' ' || ue.apellidos AS estudiante,
        a.id,
        a.fecha,
        a.estado,
        a.observacion,
        au.id AS aula_id,
        g.nombre AS grado,
        s.nombre AS seccion,
        au.turno
      FROM estudiantes e
      INNER JOIN users ue ON e.user_id = ue.id
      LEFT JOIN asistencias a ON a.estudiante_id = e.id
      LEFT JOIN aulas au ON a.aula_id = au.id
      LEFT JOIN grados g ON au.grado_id = g.id
      LEFT JOIN secciones s ON au.seccion_id = s.id
      WHERE e.user_id = $1
      ORDER BY a.fecha DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  if (rol === 'Apoderado') {
    const query = `
      SELECT
        e.id AS estudiante_id,
        ue.nombres || ' ' || ue.apellidos AS estudiante,
        ea.parentesco,
        a.id,
        a.fecha,
        a.estado,
        a.observacion,
        au.id AS aula_id,
        g.nombre AS grado,
        s.nombre AS seccion,
        au.turno
      FROM apoderados ap
      INNER JOIN estudiante_apoderado ea ON ea.apoderado_id = ap.id
      INNER JOIN estudiantes e ON ea.estudiante_id = e.id
      INNER JOIN users ue ON e.user_id = ue.id
      LEFT JOIN asistencias a ON a.estudiante_id = e.id
      LEFT JOIN aulas au ON a.aula_id = au.id
      LEFT JOIN grados g ON au.grado_id = g.id
      LEFT JOIN secciones s ON au.seccion_id = s.id
      WHERE ap.user_id = $1
      ORDER BY ue.apellidos ASC, ue.nombres ASC, a.fecha DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  if (rol === 'Docente') {
    const query = `
      SELECT
        a.id,
        a.fecha,
        a.estado,
        a.observacion,
        e.id AS estudiante_id,
        ue.nombres || ' ' || ue.apellidos AS estudiante,
        ue.dni,
        au.id AS aula_id,
        g.nombre AS grado,
        s.nombre AS seccion,
        au.turno,
        c.id AS curso_id,
        c.nombre AS curso
      FROM docentes d
      INNER JOIN docente_curso dc ON dc.docente_id = d.id
      INNER JOIN cursos c ON dc.curso_id = c.id
      INNER JOIN aulas au ON dc.aula_id = au.id
      INNER JOIN grados g ON au.grado_id = g.id
      INNER JOIN secciones s ON au.seccion_id = s.id
      INNER JOIN matriculas m
        ON m.aula_id = au.id
        AND m.estado = 'aprobado'
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      INNER JOIN users ue ON e.user_id = ue.id
      LEFT JOIN asistencias a
        ON a.estudiante_id = e.id
        AND a.aula_id = au.id
      WHERE d.user_id = $1
      ORDER BY a.fecha DESC, ue.apellidos ASC, ue.nombres ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  return [];
};