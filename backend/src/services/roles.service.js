import pool from '../config/db.js';

export const getAllRoles = async () => {
  const query = `
    SELECT
      id,
      nombre
    FROM roles
    ORDER BY
      CASE nombre
        WHEN 'Director' THEN 1
        WHEN 'Administrativo' THEN 2
        WHEN 'Auxiliar' THEN 3
        WHEN 'Docente' THEN 4
        WHEN 'Estudiante' THEN 5
        WHEN 'Apoderado' THEN 6
        ELSE 99
      END,
      nombre ASC
  `;

  const result = await pool.query(query);
  return result.rows;
};