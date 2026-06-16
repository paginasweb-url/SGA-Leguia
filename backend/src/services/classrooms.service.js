import pool from '../config/db.js';

export const getClassrooms = async ({ estado } = {}) => {
  const values = [];
  const conditions = [];

  if (estado) {
    values.push(estado);
    conditions.push(`a.estado = $${values.length}`);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const query = `
    SELECT
      a.id,
      a.grado_id,
      g.nombre AS grado,
      a.seccion_id,
      s.nombre AS seccion,
      a.turno,
      a.capacidad,
      a.estado,
      COUNT(m.id)::int AS matriculados,
      GREATEST(a.capacidad - COUNT(m.id)::int, 0)::int AS vacantes,
      a.created_at
    FROM aulas a
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    LEFT JOIN matriculas m
      ON m.aula_id = a.id
      AND m.estado = 'aprobado'
    ${whereClause}
    GROUP BY
      a.id,
      a.grado_id,
      g.nombre,
      a.seccion_id,
      s.nombre,
      a.turno,
      a.capacidad,
      a.estado,
      a.created_at
    ORDER BY a.grado_id ASC, s.nombre ASC, a.turno ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getClassroomById = async (id) => {
  const query = `
    SELECT
      a.id,
      a.grado_id,
      g.nombre AS grado,
      a.seccion_id,
      s.nombre AS seccion,
      a.turno,
      a.capacidad,
      a.estado,
      COUNT(m.id)::int AS matriculados,
      GREATEST(a.capacidad - COUNT(m.id)::int, 0)::int AS vacantes,
      a.created_at
    FROM aulas a
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    LEFT JOIN matriculas m
      ON m.aula_id = a.id
      AND m.estado = 'aprobado'
    WHERE a.id = $1
    GROUP BY
      a.id,
      a.grado_id,
      g.nombre,
      a.seccion_id,
      s.nombre,
      a.turno,
      a.capacidad,
      a.estado,
      a.created_at
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createClassroom = async (classroomData) => {
  const {
    grado_id,
    seccion_id,
    turno,
    capacidad = 35,
    estado = 'activo'
  } = classroomData;

  const query = `
    INSERT INTO aulas (
      grado_id,
      seccion_id,
      turno,
      capacidad,
      estado,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    grado_id,
    seccion_id,
    turno,
    capacidad,
    estado
  ]);

  return result.rows[0];
};

export const updateClassroom = async (id, classroomData) => {
  const {
    grado_id,
    seccion_id,
    turno,
    capacidad,
    estado
  } = classroomData;

  const query = `
    UPDATE aulas
    SET
      grado_id = COALESCE($1, grado_id),
      seccion_id = COALESCE($2, seccion_id),
      turno = COALESCE($3, turno),
      capacidad = COALESCE($4, capacidad),
      estado = COALESCE($5, estado)
    WHERE id = $6
    RETURNING *
  `;

  const result = await pool.query(query, [
    grado_id,
    seccion_id,
    turno,
    capacidad,
    estado,
    id
  ]);

  return result.rows[0];
};

export const deactivateClassroom = async (id) => {
  const query = `
    UPDATE aulas
    SET estado = 'inactivo'
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};