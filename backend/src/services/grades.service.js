import pool from '../config/db.js';

export const getGrades = async () => {
  const result = await pool.query(`
    SELECT *
    FROM grados
    ORDER BY id ASC
  `);

  return result.rows;
};

export const getGradeById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM grados
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

export const createGrade = async (nombre) => {
  const result = await pool.query(
    `
    INSERT INTO grados (nombre)
    VALUES ($1)
    RETURNING *
    `,
    [nombre]
  );

  return result.rows[0];
};

export const updateGrade = async (id, nombre) => {
  const result = await pool.query(
    `
    UPDATE grados
    SET nombre = $1
    WHERE id = $2
    RETURNING *
    `,
    [nombre, id]
  );

  return result.rows[0];
};

export const deleteGrade = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM grados
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};