import pool from '../config/db.js';

export const getTeacherCourses = async () => {
  const query = `
    SELECT
      dc.id,
      dc.docente_id,
      du.nombres || ' ' || du.apellidos AS docente,
      dc.curso_id,
      c.nombre AS curso,
      dc.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      dc.created_at
    FROM docente_curso dc
    INNER JOIN docentes d
      ON dc.docente_id = d.id
    INNER JOIN users du
      ON d.user_id = du.id
    INNER JOIN cursos c
      ON dc.curso_id = c.id
    INNER JOIN aulas a
      ON dc.aula_id = a.id
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    ORDER BY dc.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const createTeacherCourse = async (data) => {
  const { docente_id, curso_id, aula_id } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const teacherResult = await client.query(
      `
      SELECT d.id, u.estado
      FROM docentes d
      INNER JOIN users u
        ON d.user_id = u.id
      WHERE d.id = $1
      `,
      [docente_id]
    );

    if (teacherResult.rows.length === 0) {
      throw new Error('El docente no existe');
    }

    if (teacherResult.rows[0].estado !== 'activo') {
      throw new Error('El docente no está activo');
    }

    const courseResult = await client.query(
      `
      SELECT id
      FROM cursos
      WHERE id = $1
      `,
      [curso_id]
    );

    if (courseResult.rows.length === 0) {
      throw new Error('El curso no existe');
    }

    const classroomResult = await client.query(
      `
      SELECT id, estado
      FROM aulas
      WHERE id = $1
      `,
      [aula_id]
    );

    if (classroomResult.rows.length === 0) {
      throw new Error('El aula no existe');
    }

    if (classroomResult.rows[0].estado !== 'activo') {
      throw new Error('El aula seleccionada no está activa');
    }

    const exactDuplicate = await client.query(
      `
      SELECT id
      FROM docente_curso
      WHERE docente_id = $1
        AND curso_id = $2
        AND aula_id = $3
      LIMIT 1
      `,
      [docente_id, curso_id, aula_id]
    );

    if (exactDuplicate.rows.length > 0) {
      throw new Error('El docente ya está asignado a ese curso y aula');
    }

    const courseClassroomDuplicate = await client.query(
      `
      SELECT id
      FROM docente_curso
      WHERE curso_id = $1
        AND aula_id = $2
      LIMIT 1
      `,
      [curso_id, aula_id]
    );

    if (courseClassroomDuplicate.rows.length > 0) {
      throw new Error('Ese curso ya tiene un docente asignado en esa aula');
    }

    const result = await client.query(
      `
      INSERT INTO docente_curso (
        docente_id,
        curso_id,
        aula_id,
        created_at
      )
      VALUES ($1,$2,$3,NOW())
      RETURNING *
      `,
      [
        docente_id,
        curso_id,
        aula_id
      ]
    );

    await client.query('COMMIT');

    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getTeacherCoursesByTeacher = async (teacherId) => {
  const query = `
    SELECT
      dc.id,
      dc.docente_id,
      du.nombres || ' ' || du.apellidos AS docente,
      dc.curso_id,
      c.nombre AS curso,
      dc.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM docente_curso dc
    INNER JOIN docentes d
      ON dc.docente_id = d.id
    INNER JOIN users du
      ON d.user_id = du.id
    INNER JOIN cursos c
      ON dc.curso_id = c.id
    INNER JOIN aulas a
      ON dc.aula_id = a.id
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    WHERE dc.docente_id = $1
    ORDER BY c.nombre ASC
  `;

  const result = await pool.query(query, [teacherId]);
  return result.rows;
};

export const getTeacherCoursesByClassroom = async (classroomId) => {
  const query = `
    SELECT
      dc.id,
      dc.docente_id,
      du.nombres || ' ' || du.apellidos AS docente,
      dc.curso_id,
      c.nombre AS curso,
      dc.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM docente_curso dc
    INNER JOIN docentes d
      ON dc.docente_id = d.id
    INNER JOIN users du
      ON d.user_id = du.id
    INNER JOIN cursos c
      ON dc.curso_id = c.id
    INNER JOIN aulas a
      ON dc.aula_id = a.id
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    WHERE dc.aula_id = $1
    ORDER BY c.nombre ASC
  `;

  const result = await pool.query(query, [classroomId]);
  return result.rows;
};

export const deleteTeacherCourse = async (id) => {
  const query = `
    DELETE FROM docente_curso
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const getTeacherCoursesByUserId = async (userId) => {
  const query = `
    SELECT
      dc.id,
      dc.docente_id,
      du.nombres || ' ' || du.apellidos AS docente,
      dc.curso_id,
      c.nombre AS curso,
      dc.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      dc.created_at
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    INNER JOIN users du ON d.user_id = du.id
    INNER JOIN cursos c ON dc.curso_id = c.id
    INNER JOIN aulas a ON dc.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE d.user_id = $1
    ORDER BY g.id ASC, s.nombre ASC, c.nombre ASC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const getTeacherStudentsByUserId = async (userId) => {
  const query = `
    SELECT
      dc.docente_id,
      dc.curso_id,
      c.nombre AS curso,
      dc.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      e.id AS estudiante_id,
      e.codigo_estudiante,
      ue.nombres,
      ue.apellidos,
      ue.dni,
      ue.correo,
      e.estado,
      m.periodo_id,
      m.estado AS matricula_estado
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    INNER JOIN cursos c ON dc.curso_id = c.id
    INNER JOIN aulas a ON dc.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN matriculas m
      ON m.aula_id = a.id
      AND m.estado = 'aprobado'
    INNER JOIN estudiantes e ON m.estudiante_id = e.id
    INNER JOIN users ue ON e.user_id = ue.id
    WHERE d.user_id = $1
      AND e.estado = 'activo'
    ORDER BY
      g.id ASC,
      s.nombre ASC,
      a.turno ASC,
      ue.apellidos ASC,
      ue.nombres ASC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};