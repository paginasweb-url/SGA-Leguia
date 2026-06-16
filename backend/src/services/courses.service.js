import pool from '../config/db.js';

export const getCourses = async () => {
  const result = await pool.query(`
    SELECT *
    FROM cursos
    ORDER BY nombre ASC
  `);

  return result.rows;
};

export const getCourseById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM cursos
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

export const createCourse = async (nombre) => {
  const result = await pool.query(
    `
    INSERT INTO cursos (nombre)
    VALUES ($1)
    RETURNING *
    `,
    [nombre]
  );

  return result.rows[0];
};

export const updateCourse = async (id, nombre) => {
  const result = await pool.query(
    `
    UPDATE cursos
    SET nombre = $1
    WHERE id = $2
    RETURNING *
    `,
    [nombre, id]
  );

  return result.rows[0];
};

export const deleteCourse = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM cursos
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};

export const getCoursesByStudentUserId = async (userId) => {
  const query = `
    SELECT DISTINCT
      c.id,
      c.nombre,
      dc.docente_id,
      ud.nombres || ' ' || ud.apellidos AS docente,
      dc.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM estudiantes e
    INNER JOIN matriculas m
      ON m.estudiante_id = e.id
      AND m.estado = 'aprobado'
    INNER JOIN aulas a ON m.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN docente_curso dc ON dc.aula_id = a.id
    INNER JOIN cursos c ON dc.curso_id = c.id
    INNER JOIN docentes d ON dc.docente_id = d.id
    INNER JOIN users ud ON d.user_id = ud.id
    WHERE e.user_id = $1
    ORDER BY c.nombre ASC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};