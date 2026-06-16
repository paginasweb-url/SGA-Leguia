import pool from '../config/db.js';

export const getUsers = async ({ requesterRole }) => {
  const values = [];
  let whereClause = '';

  if (requesterRole === 'Administrativo') {
    whereClause = `
      WHERE r.nombre IN ('Estudiante', 'Docente', 'Apoderado')
    `;
  }

  const query = `
    SELECT 
      u.id,
      u.rol_id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      u.estado,
      u.must_change_password,
      u.created_at,
      r.nombre AS rol
    FROM users u
    INNER JOIN roles r
      ON u.rol_id = r.id
    ${whereClause}
    ORDER BY u.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const createUser = async (userData) => {
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
    estado = 'activo'
  } = userData;

  const query = `
    INSERT INTO users (
      id,
      rol_id,
      nombres,
      apellidos,
      dni,
      username,
      correo,
      telefono,
      password_hash,
      estado,
      must_change_password,
      created_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,NOW()
    )
    RETURNING
      id,
      rol_id,
      nombres,
      apellidos,
      dni,
      username,
      correo,
      telefono,
      estado,
      must_change_password,
      created_at
  `;

  const values = [
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
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getUserById = async (id) => {
  const query = `
    SELECT 
      u.id,
      u.rol_id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      u.estado,
      u.must_change_password,
      u.created_at,
      r.nombre AS rol
    FROM users u
    INNER JOIN roles r
      ON u.rol_id = r.id
    WHERE u.id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const updateUser = async (id, userData) => {
  const {
    nombres,
    apellidos,
    telefono,
    estado
  } = userData;

  const query = `
    UPDATE users
    SET
      nombres = COALESCE($1, nombres),
      apellidos = COALESCE($2, apellidos),
      telefono = COALESCE($3, telefono),
      estado = COALESCE($4, estado)
    WHERE id = $5
    RETURNING
      id,
      rol_id,
      nombres,
      apellidos,
      dni,
      username,
      correo,
      telefono,
      estado,
      must_change_password,
      created_at
  `;

  const values = [
    nombres,
    apellidos,
    telefono,
    estado,
    id
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deactivateUser = async (id) => {
  const query = `
    UPDATE users
    SET estado = 'inactivo'
    WHERE id = $1
    RETURNING
      id,
      rol_id,
      nombres,
      apellidos,
      dni,
      username,
      correo,
      telefono,
      estado,
      must_change_password,
      created_at
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};