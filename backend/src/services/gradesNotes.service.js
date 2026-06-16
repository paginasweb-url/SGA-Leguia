import pool from '../config/db.js';

export const getStudentsForGrades = async (aulaId, periodoId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni
    FROM matriculas m
    INNER JOIN estudiantes e ON m.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    WHERE m.aula_id = $1
      AND m.periodo_id = $2
      AND m.estado = 'aprobado'
      AND e.estado = 'activo'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [aulaId, periodoId]);
  return result.rows;
};

export const saveGrades = async ({
  aula_id,
  curso_id,
  periodo_id,
  bimestre,
  notas
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const allowedGrades = ['AD', 'A', 'B', 'C'];
    const allowedBimesters = ['B1', 'B2', 'B3', 'B4'];

    if (!allowedBimesters.includes(bimestre)) {
      throw new Error('Bimestre no válido');
    }

    const periodCheck = await client.query(
      `
      SELECT id
      FROM periodos_academicos
      WHERE id = $1
      LIMIT 1
      `,
      [periodo_id]
    );

    if (periodCheck.rows.length === 0) {
      throw new Error('El período académico no existe');
    }

    const courseCheck = await client.query(
      `
      SELECT id
      FROM cursos
      WHERE id = $1
      LIMIT 1
      `,
      [curso_id]
    );

    if (courseCheck.rows.length === 0) {
      throw new Error('El curso no existe');
    }

    const classroomCheck = await client.query(
      `
      SELECT id
      FROM aulas
      WHERE id = $1
      LIMIT 1
      `,
      [aula_id]
    );

    if (classroomCheck.rows.length === 0) {
      throw new Error('El aula no existe');
    }

    for (const item of notas) {
      const { estudiante_id, nota, comentario } = item;

      if (!estudiante_id) {
        throw new Error('Cada registro debe incluir estudiante_id');
      }

      if (!allowedGrades.includes(nota)) {
        throw new Error(`Nota no válida para estudiante ${estudiante_id}`);
      }

      const enrollmentCheck = await client.query(
        `
        SELECT id
        FROM matriculas
        WHERE estudiante_id = $1
          AND aula_id = $2
          AND periodo_id = $3
          AND estado = 'aprobado'
        LIMIT 1
        `,
        [estudiante_id, aula_id, periodo_id]
      );

      if (enrollmentCheck.rows.length === 0) {
        throw new Error(
          `El estudiante ${estudiante_id} no pertenece al aula indicada en el período seleccionado`
        );
      }

      await client.query(
        `
        INSERT INTO notas (
          estudiante_id,
          curso_id,
          aula_id,
          periodo_id,
          bimestre,
          nota,
          comentario,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
        ON CONFLICT (estudiante_id, curso_id, aula_id, bimestre, periodo_id)
        DO UPDATE SET
          nota = EXCLUDED.nota,
          comentario = EXCLUDED.comentario
        `,
        [
          estudiante_id,
          curso_id,
          aula_id,
          periodo_id,
          bimestre,
          nota,
          comentario || null
        ]
      );
    }

    await client.query('COMMIT');

    return {
      aula_id,
      curso_id,
      periodo_id,
      bimestre,
      total_registros: notas.length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getGradesByClassroomCourseBimester = async (
  aulaId,
  cursoId,
  bimestre,
  periodoId
) => {
  const query = `
    SELECT
      n.id,
      n.estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      n.curso_id,
      c.nombre AS curso,
      n.aula_id,
      n.periodo_id,
      p.nombre AS periodo,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      n.bimestre,
      n.nota,
      n.comentario,
      n.created_at
    FROM notas n
    INNER JOIN estudiantes e ON n.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN periodos_academicos p ON n.periodo_id = p.id
    WHERE n.aula_id = $1
      AND n.curso_id = $2
      AND n.bimestre = $3
      AND n.periodo_id = $4
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [
    aulaId,
    cursoId,
    bimestre,
    periodoId
  ]);

  return result.rows;
};

export const getGradesByStudent = async (studentId, periodoId = null) => {
  const values = [studentId];

  let periodFilter = '';

  if (periodoId) {
    values.push(periodoId);
    periodFilter = `AND n.periodo_id = $${values.length}`;
  }

  const query = `
    SELECT
      n.id,
      n.periodo_id,
      p.nombre AS periodo,
      n.bimestre,
      n.nota,
      n.comentario,
      c.nombre AS curso,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      n.created_at
    FROM notas n
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN periodos_academicos p ON n.periodo_id = p.id
    WHERE n.estudiante_id = $1
      ${periodFilter}
    ORDER BY n.periodo_id ASC, n.bimestre ASC, c.nombre ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getGradesSummaryByClassroomCourse = async (
  aulaId,
  cursoId,
  bimestre,
  periodoId
) => {
  const query = `
    SELECT
      nota,
      COUNT(*)::int AS total
    FROM notas
    WHERE aula_id = $1
      AND curso_id = $2
      AND bimestre = $3
      AND periodo_id = $4
    GROUP BY nota
    ORDER BY nota ASC
  `;

  const result = await pool.query(query, [
    aulaId,
    cursoId,
    bimestre,
    periodoId
  ]);

  return result.rows;
};

export const getStudentsAtRisk = async (aulaId, bimestre, periodoId) => {
  const query = `
    SELECT
      n.estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      c.nombre AS curso,
      n.periodo_id,
      p.nombre AS periodo,
      n.bimestre,
      n.nota,
      n.comentario
    FROM notas n
    INNER JOIN estudiantes e ON n.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN periodos_academicos p ON n.periodo_id = p.id
    WHERE n.aula_id = $1
      AND n.periodo_id = $2
      AND n.bimestre = $3
      AND n.nota = 'C'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [
    aulaId,
    periodoId,
    bimestre
  ]);

  return result.rows;
};

export const teacherCanAccessClassroom = async (teacherUserId, aulaId) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    WHERE d.user_id = $1
      AND dc.aula_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [teacherUserId, aulaId]);
  return result.rows.length > 0;
};

export const teacherCanAccessClassroomCourse = async (
  teacherUserId,
  aulaId,
  cursoId
) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    WHERE d.user_id = $1
      AND dc.aula_id = $2
      AND dc.curso_id = $3
    LIMIT 1
  `;

  const result = await pool.query(query, [
    teacherUserId,
    aulaId,
    cursoId
  ]);

  return result.rows.length > 0;
};

export const teacherCanAccessStudentGrades = async (
  teacherUserId,
  studentId
) => {
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

  const result = await pool.query(query, [
    teacherUserId,
    studentId
  ]);

  return result.rows.length > 0;
};

export const studentOwnsGrades = async (studentUserId, studentId) => {
  const query = `
    SELECT id
    FROM estudiantes
    WHERE user_id = $1
      AND id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [
    studentUserId,
    studentId
  ]);

  return result.rows.length > 0;
};

export const guardianCanAccessGrades = async (
  guardianUserId,
  studentId
) => {
  const query = `
    SELECT ea.id
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea
      ON ea.apoderado_id = ap.id
    WHERE ap.user_id = $1
      AND ea.estudiante_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [
    guardianUserId,
    studentId
  ]);

  return result.rows.length > 0;
};

export const getStudentProfileByUserId = async (userId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni
    FROM estudiantes e
    INNER JOIN users u ON e.user_id = u.id
    WHERE e.user_id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

export const getGuardianChildrenForGrades = async (guardianUserId) => {
  const query = `
    SELECT
      ea.parentesco,
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea
      ON ea.apoderado_id = ap.id
    INNER JOIN estudiantes e
      ON ea.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    WHERE ap.user_id = $1
      AND e.estado = 'activo'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [guardianUserId]);
  return result.rows;
};