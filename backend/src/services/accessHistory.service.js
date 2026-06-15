import pool from '../config/db.js';

export const registerAccessAttempt = async ({
  usuario_ingresado,
  user_id = null,
  rol = null,
  resultado,
  motivo,
  ip = null,
  user_agent = null
}) => {
  const query = `
    INSERT INTO historial_accesos (
      usuario_ingresado,
      user_id,
      rol,
      resultado,
      motivo,
      ip,
      user_agent
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    usuario_ingresado,
    user_id,
    rol,
    resultado,
    motivo,
    ip,
    user_agent
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getAccessHistory = async ({
  usuario,
  rol,
  resultado,
  fechaInicio,
  fechaFin,
  page = 1,
  limit = 50
}) => {
  const conditions = [];
  const values = [];

  if (usuario) {
    values.push(`%${usuario}%`);
    conditions.push(`usuario_ingresado ILIKE $${values.length}`);
  }

  if (rol) {
    values.push(rol);
    conditions.push(`rol = $${values.length}`);
  }

  if (resultado) {
    values.push(resultado);
    conditions.push(`resultado = $${values.length}`);
  }

  if (fechaInicio) {
    values.push(fechaInicio);
    conditions.push(`created_at::date >= $${values.length}`);
  }

  if (fechaFin) {
    values.push(fechaFin);
    conditions.push(`created_at::date <= $${values.length}`);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const offset = (Number(page) - 1) * Number(limit);

  values.push(Number(limit));
  const limitParam = `$${values.length}`;

  values.push(offset);
  const offsetParam = `$${values.length}`;

  const query = `
    SELECT
      id,
      usuario_ingresado,
      user_id,
      rol,
      resultado,
      motivo,
      ip,
      user_agent,
      created_at
    FROM historial_accesos
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM historial_accesos
    ${whereClause}
  `;

  const dataResult = await pool.query(query, values);

  const countValues = values.slice(0, values.length - 2);
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