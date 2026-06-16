import pool from '../config/db.js';

export const getSections = async () => {
  const result = await pool.query(`
    SELECT *
    FROM secciones
    ORDER BY id ASC
  `);

  return result.rows;
};

export const getSectionById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM secciones
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

export const createSection = async (nombre) => {
  const result = await pool.query(
    `
    INSERT INTO secciones (nombre)
    VALUES ($1)
    RETURNING *
    `,
    [nombre]
  );

  return result.rows[0];
};

export const updateSection = async (id, nombre) => {
  const result = await pool.query(
    `
    UPDATE secciones
    SET nombre = $1
    WHERE id = $2
    RETURNING *
    `,
    [nombre, id]
  );

  return result.rows[0];
};

export const deleteSection = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM secciones
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};