import pool from '../config/db.js';

export const getNotificationsForUser = async ({
  userId,
  limit = 10
}) => {
  const safeLimit = Math.min(Number(limit) || 10, 30);

  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      tipo,
      mensaje,
      estado,
      fecha,
      created_at
    FROM notificaciones
    WHERE user_id = $1
    ORDER BY COALESCE(fecha, created_at) DESC
    LIMIT $2
    `,
    [
      userId,
      safeLimit
    ]
  );

  return result.rows;
};

export const markNotificationAsReadByUser = async ({
  id,
  userId
}) => {
  const result = await pool.query(
    `
    UPDATE notificaciones
    SET estado = 'leida'
    WHERE id = $1
      AND user_id = $2
    RETURNING
      id,
      user_id,
      tipo,
      mensaje,
      estado,
      fecha,
      created_at
    `,
    [
      id,
      userId
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('La notificación no existe o no pertenece al usuario');
  }

  return result.rows[0];
};