import pool from '../config/db.js';

export const createEnrollmentFormat = async ({
  titulo,
  descripcion,
  nombre_archivo,
  storage_path,
  publicado_por
}) => {
  const query = `
    INSERT INTO formatos_matricula (
      titulo,
      descripcion,
      nombre_archivo,
      storage_path,
      publicado_por,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, 'activo')
    RETURNING *
  `;

  const values = [
    titulo,
    descripcion,
    nombre_archivo,
    storage_path,
    publicado_por
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getEnrollmentFormats = async ({
  estado,
  usuario,
  page = 1,
  limit = 50
}) => {
  const conditions = [];
  const values = [];

  if (estado) {
    values.push(estado);
    conditions.push(`fm.estado = $${values.length}`);
  }

  if (usuario) {
    values.push(`%${usuario}%`);
    conditions.push(`
      (
        u.nombres ILIKE $${values.length}
        OR u.apellidos ILIKE $${values.length}
        OR u.username ILIKE $${values.length}
      )
    `);
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
      fm.id,
      fm.titulo,
      fm.descripcion,
      fm.nombre_archivo,
      fm.storage_path,
      fm.estado,
      fm.publicado_por,
      u.nombres AS publicado_por_nombres,
      u.apellidos AS publicado_por_apellidos,
      u.username AS publicado_por_username,
      fm.created_at,
      fm.updated_at
    FROM formatos_matricula fm
    LEFT JOIN users u ON fm.publicado_por = u.id
    ${whereClause}
    ORDER BY fm.created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM formatos_matricula fm
    LEFT JOIN users u ON fm.publicado_por = u.id
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

export const getPublicEnrollmentFormats = async () => {
  const query = `
    SELECT
      id,
      titulo,
      descripcion,
      nombre_archivo,
      estado,
      created_at,
      updated_at
    FROM formatos_matricula
    WHERE estado = 'activo'
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getEnrollmentFormatById = async (id) => {
  const query = `
    SELECT
      fm.id,
      fm.titulo,
      fm.descripcion,
      fm.nombre_archivo,
      fm.storage_path,
      fm.estado,
      fm.publicado_por,
      u.nombres AS publicado_por_nombres,
      u.apellidos AS publicado_por_apellidos,
      u.username AS publicado_por_username,
      fm.created_at,
      fm.updated_at
    FROM formatos_matricula fm
    LEFT JOIN users u ON fm.publicado_por = u.id
    WHERE fm.id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const updateEnrollmentFormat = async ({
  id,
  titulo,
  descripcion
}) => {
  const query = `
    UPDATE formatos_matricula
    SET
      titulo = COALESCE($1, titulo),
      descripcion = COALESCE($2, descripcion),
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

  const values = [
    titulo,
    descripcion,
    id
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateEnrollmentFormatStatus = async ({
  id,
  estado
}) => {
  const query = `
    UPDATE formatos_matricula
    SET
      estado = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [estado, id]);
  return result.rows[0];
};