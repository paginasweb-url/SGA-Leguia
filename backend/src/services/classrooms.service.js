import pool from '../config/db.js';

export const getClassrooms = async () => {
  const query = `
    SELECT
      a.id,
      a.grado_id,
      g.nombre AS grado,
      a.seccion_id,
      s.nombre AS seccion,
      a.turno,
      a.created_at
    FROM aulas a
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    ORDER BY g.id ASC, s.nombre ASC
  `;

  const result = await pool.query(query);
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
      a.created_at
    FROM aulas a
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    WHERE a.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createClassroom = async (classroomData) => {
  const { grado_id, seccion_id, turno } = classroomData;

  const query = `
    INSERT INTO aulas (
      grado_id,
      seccion_id,
      turno,
      created_at
    )
    VALUES ($1,$2,$3,NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    grado_id,
    seccion_id,
    turno
  ]);

  return result.rows[0];
};

export const updateClassroom = async (id, classroomData) => {
  const { grado_id, seccion_id, turno } = classroomData;

  const query = `
    UPDATE aulas
    SET
      grado_id = $1,
      seccion_id = $2,
      turno = $3
    WHERE id = $4
    RETURNING *
  `;

  const result = await pool.query(query, [
    grado_id,
    seccion_id,
    turno,
    id
  ]);

  return result.rows[0];
};

export const deleteClassroom = async (id) => {
  const query = `
    DELETE FROM aulas
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};