import pool from '../config/db.js';

export const linkGuardianToStudent = async ({ estudiante_id, apoderado_id, parentesco }) => {
  const query = `
    INSERT INTO estudiante_apoderado (
      estudiante_id,
      apoderado_id,
      parentesco,
      created_at
    )
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    estudiante_id,
    apoderado_id,
    parentesco
  ]);

  return result.rows[0];
};

export const getGuardiansByStudent = async (studentId) => {
  const query = `
    SELECT
      ea.id AS relacion_id,
      ea.parentesco,
      a.id AS apoderado_id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      u.estado
    FROM estudiante_apoderado ea
    INNER JOIN apoderados a
      ON ea.apoderado_id = a.id
    INNER JOIN users u
      ON a.user_id = u.id
    WHERE ea.estudiante_id = $1
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getStudentsByGuardian = async (guardianId) => {
  const query = `
    SELECT
      ea.id AS relacion_id,
      ea.parentesco,
      e.id AS estudiante_id,
      e.codigo_estudiante,
      e.fecha_nacimiento,
      e.direccion,
      e.estado,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono
    FROM estudiante_apoderado ea
    INNER JOIN estudiantes e
      ON ea.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    WHERE ea.apoderado_id = $1
  `;

  const result = await pool.query(query, [guardianId]);
  return result.rows;
};

export const unlinkGuardianStudent = async (relationId) => {
  const query = `
    DELETE FROM estudiante_apoderado
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [relationId]);
  return result.rows[0];
};