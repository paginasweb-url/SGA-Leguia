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