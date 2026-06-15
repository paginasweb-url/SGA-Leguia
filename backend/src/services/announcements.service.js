import pool from '../config/db.js';

export const createAnnouncement = async (data) => {
  const {
    titulo,
    contenido,
    publicado_por,
    destinatario_tipo,
    aula_id
  } = data;

  const query = `
    INSERT INTO comunicados (
      titulo,
      contenido,
      publicado_por,
      destinatario_tipo,
      aula_id,
      fecha,
      created_at
    )
    VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    titulo,
    contenido,
    publicado_por,
    destinatario_tipo || 'general',
    aula_id || null
  ]);

  return result.rows[0];
};

export const getAnnouncements = async () => {
  const query = `
    SELECT
      c.*,
      u.nombres || ' ' || u.apellidos AS publicado_por_nombre,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM comunicados c
    LEFT JOIN users u ON c.publicado_por = u.id
    LEFT JOIN aulas a ON c.aula_id = a.id
    LEFT JOIN grados g ON a.grado_id = g.id
    LEFT JOIN secciones s ON a.seccion_id = s.id
    ORDER BY c.fecha DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getAnnouncementById = async (id) => {
  const query = `
    SELECT
      c.*,
      u.nombres || ' ' || u.apellidos AS publicado_por_nombre
    FROM comunicados c
    LEFT JOIN users u ON c.publicado_por = u.id
    WHERE c.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const getAnnouncementsForUser = async (userId, rol) => {
  const query = `
    SELECT
      c.*,
      cl.leido,
      cl.fecha_lectura
    FROM comunicados c
    LEFT JOIN comunicado_lecturas cl
      ON cl.comunicado_id = c.id
      AND cl.user_id = $1
    WHERE
      c.destinatario_tipo = 'general'
      OR c.destinatario_tipo = LOWER($2)
      OR (
        c.destinatario_tipo = 'aula'
        AND c.aula_id IN (
          SELECT m.aula_id
          FROM matriculas m
          INNER JOIN estudiantes e ON m.estudiante_id = e.id
          WHERE e.user_id = $1
            AND m.estado = 'aprobado'
        )
      )
      OR (
        c.destinatario_tipo = 'aula'
        AND c.aula_id IN (
          SELECT m.aula_id
          FROM matriculas m
          INNER JOIN estudiante_apoderado ea ON m.estudiante_id = ea.estudiante_id
          INNER JOIN apoderados ap ON ea.apoderado_id = ap.id
          WHERE ap.user_id = $1
            AND m.estado = 'aprobado'
        )
      )
    ORDER BY c.fecha DESC
  `;

  const result = await pool.query(query, [userId, rol]);
  return result.rows;
};

export const confirmAnnouncementRead = async (comunicadoId, userId) => {
  const query = `
    INSERT INTO comunicado_lecturas (
      comunicado_id,
      user_id,
      leido,
      fecha_lectura,
      created_at
    )
    VALUES ($1,$2,true,NOW(),NOW())
    ON CONFLICT (comunicado_id, user_id)
    DO UPDATE SET
      leido = true,
      fecha_lectura = NOW()
    RETURNING *
  `;

  const result = await pool.query(query, [comunicadoId, userId]);
  return result.rows[0];
};

export const getAnnouncementReadSummary = async (comunicadoId) => {
  const query = `
    SELECT
      c.id AS comunicado_id,
      c.titulo,
      COUNT(cl.id)::int AS total_confirmaciones,
      COUNT(CASE WHEN cl.leido = true THEN 1 END)::int AS total_leidos
    FROM comunicados c
    LEFT JOIN comunicado_lecturas cl ON c.id = cl.comunicado_id
    WHERE c.id = $1
    GROUP BY c.id, c.titulo
  `;

  const result = await pool.query(query, [comunicadoId]);
  return result.rows[0];
};