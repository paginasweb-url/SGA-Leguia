import pool from '../config/db.js';

export const getAcademicPeriods = async () => {
  const query = `
    SELECT *
    FROM periodos_academicos
    ORDER BY fecha_inicio DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getAcademicPeriodById = async (id) => {
  const query = `
    SELECT *
    FROM periodos_academicos
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createAcademicPeriod = async (periodData) => {
  const { nombre, fecha_inicio, fecha_fin, estado } = periodData;

  const query = `
    INSERT INTO periodos_academicos (
      nombre,
      fecha_inicio,
      fecha_fin,
      estado,
      created_at
    )
    VALUES ($1,$2,$3,$4,NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    nombre,
    fecha_inicio,
    fecha_fin,
    estado
  ]);

  return result.rows[0];
};

export const updateAcademicPeriod = async (id, periodData) => {
  const { nombre, fecha_inicio, fecha_fin, estado } = periodData;

  const query = `
    UPDATE periodos_academicos
    SET
      nombre = $1,
      fecha_inicio = $2,
      fecha_fin = $3,
      estado = $4
    WHERE id = $5
    RETURNING *
  `;

  const result = await pool.query(query, [
    nombre,
    fecha_inicio,
    fecha_fin,
    estado,
    id
  ]);

  return result.rows[0];
};

export const activateAcademicPeriod = async (id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE periodos_academicos
      SET estado = 'inactivo'
    `);

    const result = await client.query(
      `
      UPDATE periodos_academicos
      SET estado = 'activo'
      WHERE id = $1
      RETURNING *
      `,
      [id]
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