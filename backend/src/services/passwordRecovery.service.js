import pool from '../config/db.js';

export const findStudentForRecovery = async ({
  usuario,
  dni,
  fecha_nacimiento,
  apoderado_dni
}) => {
  const query = `
    SELECT DISTINCT
      u.id AS user_id,
      u.username,
      u.correo,
      u.dni,
      u.nombres,
      u.apellidos,
      r.nombre AS rol
    FROM users u
    INNER JOIN roles r ON u.rol_id = r.id
    INNER JOIN estudiantes e ON e.user_id = u.id
    INNER JOIN estudiante_apoderado ea ON ea.estudiante_id = e.id
    INNER JOIN apoderados ap ON ap.id = ea.apoderado_id
    INNER JOIN users uap ON uap.id = ap.user_id
    WHERE
      (u.username = $1 OR u.correo = $1)
      AND u.dni = $2
      AND e.fecha_nacimiento::date = $3
      AND uap.dni = $4
      AND r.nombre = 'Estudiante'
    LIMIT 1
  `;

  const values = [
    usuario,
    dni,
    fecha_nacimiento,
    apoderado_dni
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findGuardianForRecovery = async ({
  usuario,
  dni,
  estudiante_dni
}) => {
  const query = `
    SELECT DISTINCT
      u.id AS user_id,
      u.username,
      u.correo,
      u.dni,
      u.nombres,
      u.apellidos,
      r.nombre AS rol
    FROM users u
    INNER JOIN roles r ON u.rol_id = r.id
    INNER JOIN apoderados ap ON ap.user_id = u.id
    INNER JOIN estudiante_apoderado ea ON ea.apoderado_id = ap.id
    INNER JOIN estudiantes e ON e.id = ea.estudiante_id
    INNER JOIN users ue ON ue.id = e.user_id
    WHERE
      (u.username = $1 OR u.correo = $1)
      AND u.dni = $2
      AND ue.dni = $3
      AND r.nombre = 'Apoderado'
    LIMIT 1
  `;

  const values = [
    usuario,
    dni,
    estudiante_dni
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const hasPendingPasswordRecovery = async (userId) => {
  const query = `
    SELECT id
    FROM solicitudes_recuperacion_password
    WHERE user_id = $1
      AND estado = 'pendiente'
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length > 0;
};

export const createPasswordRecoveryRequest = async ({
  tipo_solicitante,
  usuario_ingresado,
  dni_ingresado,
  estudiante_dni_validacion,
  user_id,
  ip,
  user_agent
}) => {
  const query = `
    INSERT INTO solicitudes_recuperacion_password (
      tipo_solicitante,
      usuario_ingresado,
      dni_ingresado,
      estudiante_dni_validacion,
      user_id,
      ip,
      user_agent
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    tipo_solicitante,
    usuario_ingresado,
    dni_ingresado,
    estudiante_dni_validacion,
    user_id,
    ip,
    user_agent
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getPasswordRecoveryRequests = async ({
  estado,
  tipo,
  usuario,
  fechaInicio,
  fechaFin,
  page = 1,
  limit = 50
}) => {
  const conditions = [];
  const values = [];

  if (estado) {
    values.push(estado);
    conditions.push(`spr.estado = $${values.length}`);
  }

  if (tipo) {
    values.push(tipo);
    conditions.push(`spr.tipo_solicitante = $${values.length}`);
  }

  if (usuario) {
    values.push(`%${usuario}%`);
    conditions.push(`spr.usuario_ingresado ILIKE $${values.length}`);
  }

  if (fechaInicio) {
    values.push(fechaInicio);
    conditions.push(`spr.created_at::date >= $${values.length}`);
  }

  if (fechaFin) {
    values.push(fechaFin);
    conditions.push(`spr.created_at::date <= $${values.length}`);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const offset = (Number(page) - 1) * Number(limit);

  const countValues = [...values];

  values.push(Number(limit));
  const limitParam = `$${values.length}`;

  values.push(offset);
  const offsetParam = `$${values.length}`;

  const query = `
    SELECT
      spr.id,
      spr.tipo_solicitante,
      spr.usuario_ingresado,
      spr.dni_ingresado,
      spr.estudiante_dni_validacion,
      spr.user_id,
      u.nombres,
      u.apellidos,
      u.username,
      u.correo,
      r.nombre AS rol,
      spr.estado,
      spr.observacion_admin,
      spr.reviewed_by,
      spr.reviewed_at,
      spr.password_reset_at,
      spr.ip,
      spr.user_agent,
      spr.created_at,
      spr.updated_at
    FROM solicitudes_recuperacion_password spr
    LEFT JOIN users u ON spr.user_id = u.id
    LEFT JOIN roles r ON u.rol_id = r.id
    ${whereClause}
    ORDER BY spr.created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM solicitudes_recuperacion_password spr
    LEFT JOIN users u ON spr.user_id = u.id
    LEFT JOIN roles r ON u.rol_id = r.id
    ${whereClause}
  `;

  const dataResult = await pool.query(query, values);
  const countResult = await pool.query(countQuery, countValues);

  return {
    data: dataResult.rows,
    pagination: {
      total: countResult.rows[0].total,
      page: Number(page),
      limit: Number(limit)
    }
  };
};

export const getPasswordRecoveryRequestById = async (id) => {
  const query = `
    SELECT
      spr.id,
      spr.tipo_solicitante,
      spr.usuario_ingresado,
      spr.dni_ingresado,
      spr.estudiante_dni_validacion,
      spr.user_id,
      u.nombres,
      u.apellidos,
      u.username,
      u.correo,
      u.estado AS user_estado,
      r.nombre AS rol,
      spr.estado,
      spr.observacion_admin,
      spr.reviewed_by,
      spr.reviewed_at,
      spr.password_reset_at,
      spr.ip,
      spr.user_agent,
      spr.created_at,
      spr.updated_at
    FROM solicitudes_recuperacion_password spr
    LEFT JOIN users u ON spr.user_id = u.id
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE spr.id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const updateUserTemporaryPassword = async (userId, hashedPassword) => {
  const query = `
    UPDATE users
    SET
      password_hash = $1,
      must_change_password = true
    WHERE id = $2
    RETURNING
      id,
      username,
      correo,
      nombres,
      apellidos,
      must_change_password
  `;

  const result = await pool.query(query, [hashedPassword, userId]);
  return result.rows[0];
};

export const approvePasswordRecoveryRequest = async ({
  requestId,
  reviewedBy,
  observacion
}) => {
  const query = `
    UPDATE solicitudes_recuperacion_password
    SET
      estado = 'aprobada',
      observacion_admin = $1,
      reviewed_by = $2,
      reviewed_at = NOW(),
      password_reset_at = NOW(),
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

  const values = [
    observacion || 'Solicitud aprobada. Se generó una contraseña temporal.',
    reviewedBy,
    requestId
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const rejectPasswordRecoveryRequest = async ({
  requestId,
  reviewedBy,
  observacion
}) => {
  const query = `
    UPDATE solicitudes_recuperacion_password
    SET
      estado = 'rechazada',
      observacion_admin = $1,
      reviewed_by = $2,
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

  const values = [
    observacion || 'Solicitud rechazada por el área administrativa.',
    reviewedBy,
    requestId
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getUserForManualPasswordReset = async (userId) => {
  const query = `
    SELECT
      u.id,
      u.username,
      u.correo,
      u.dni,
      u.nombres,
      u.apellidos,
      u.estado,
      r.nombre AS rol
    FROM users u
    INNER JOIN roles r ON u.rol_id = r.id
    WHERE u.id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

export const createManualPasswordResetRecord = async ({
  user,
  reviewedBy,
  observacion,
  ip,
  user_agent
}) => {
  const query = `
    INSERT INTO solicitudes_recuperacion_password (
      tipo_solicitante,
      usuario_ingresado,
      dni_ingresado,
      estudiante_dni_validacion,
      user_id,
      estado,
      observacion_admin,
      reviewed_by,
      reviewed_at,
      password_reset_at,
      ip,
      user_agent
    )
    VALUES (
      'manual',
      $1,
      $2,
      NULL,
      $3,
      'aprobada',
      $4,
      $5,
      NOW(),
      NOW(),
      $6,
      $7
    )
    RETURNING *
  `;

  const values = [
    user.username,
    user.dni,
    user.id,
    observacion || 'Restablecimiento manual realizado por el área administrativa.',
    reviewedBy,
    ip,
    user_agent
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const closePendingPasswordRecoveryRequestsByUser = async ({
  userId,
  reviewedBy,
  observacion
}) => {
  const query = `
    UPDATE solicitudes_recuperacion_password
    SET
      estado = 'aprobada',
      observacion_admin = $1,
      reviewed_by = $2,
      reviewed_at = NOW(),
      password_reset_at = NOW(),
      updated_at = NOW()
    WHERE user_id = $3
      AND estado = 'pendiente'
    RETURNING *
  `;

  const values = [
    observacion || 'Solicitud atendida mediante restablecimiento manual de contraseña.',
    reviewedBy,
    userId
  ];

  const result = await pool.query(query, values);
  return result.rows;
};