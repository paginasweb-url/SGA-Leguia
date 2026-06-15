import pool from '../config/db.js';

export const getGuardians = async () => {
  const query = `
    SELECT
      a.id,
      a.user_id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      u.estado
    FROM apoderados a
    INNER JOIN users u
      ON a.user_id = u.id
    ORDER BY a.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getGuardianById = async (id) => {
  const query = `
    SELECT
      a.id,
      a.user_id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      u.estado
    FROM apoderados a
    INNER JOIN users u
      ON a.user_id = u.id
    WHERE a.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createGuardian = async (guardianData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      id,
      rol_id,
      nombres,
      apellidos,
      dni,
      username,
      correo,
      telefono,
      password_hash,
      estado
    } = guardianData;

    const userResult = await client.query(
      `
      INSERT INTO users (
        id, rol_id, nombres, apellidos, dni, username, correo,
        telefono, password_hash, estado, must_change_password, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,NOW())
      RETURNING id
      `,
      [
        id,
        rol_id,
        nombres,
        apellidos,
        dni,
        username,
        correo,
        telefono,
        password_hash,
        estado
      ]
    );

    const userId = userResult.rows[0].id;

    const guardianResult = await client.query(
      `
      INSERT INTO apoderados (
        user_id, created_at
      )
      VALUES ($1,NOW())
      RETURNING *
      `,
      [userId]
    );

    await client.query('COMMIT');

    return guardianResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const updateGuardian = async (id, guardianData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      nombres,
      apellidos,
      telefono,
      estado
    } = guardianData;

    const guardianResult = await client.query(
      `SELECT user_id FROM apoderados WHERE id = $1`,
      [id]
    );

    if (guardianResult.rows.length === 0) {
      throw new Error('Apoderado no encontrado');
    }

    const userId = guardianResult.rows[0].user_id;

    const updatedUser = await client.query(
      `
      UPDATE users
      SET
        nombres = $1,
        apellidos = $2,
        telefono = $3,
        estado = $4
      WHERE id = $5
      RETURNING *
      `,
      [nombres, apellidos, telefono, estado, userId]
    );

    await client.query('COMMIT');

    return updatedUser.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const deactivateGuardian = async (id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const guardianResult = await client.query(
      `SELECT user_id FROM apoderados WHERE id = $1`,
      [id]
    );

    if (guardianResult.rows.length === 0) {
      throw new Error('Apoderado no encontrado');
    }

    const userId = guardianResult.rows[0].user_id;

    await client.query(
      `
      UPDATE users
      SET estado = 'inactivo'
      WHERE id = $1
      `,
      [userId]
    );

    const result = await client.query(
      `
      SELECT *
      FROM apoderados
      WHERE id = $1
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