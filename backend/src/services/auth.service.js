import pool from '../config/db.js';

export const loginUser = async (identifier) => {
  const isEmail = identifier.includes('@');

  const query = `
    SELECT
      u.id,
      u.nombres,
      u.apellidos,
      u.username,
      u.correo,
      u.password_hash,
      u.estado,
      u.must_change_password,
      r.nombre AS rol
    FROM users u
    INNER JOIN roles r
      ON u.rol_id = r.id
    WHERE ${isEmail ? 'u.correo = $1' : 'u.username = $1'}
  `;

  const result = await pool.query(query, [identifier]);

  return result.rows[0];
};

export const getUserAuthById = async (id) => {
  const query = `
    SELECT
      id,
      password_hash,
      must_change_password
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

export const updateUserPassword = async (id, hashedPassword) => {
  const query = `
    UPDATE users
    SET
      password_hash = $1,
      must_change_password = false
    WHERE id = $2
    RETURNING id, username, correo, must_change_password
  `;

  const result = await pool.query(query, [hashedPassword, id]);

  return result.rows[0];
};