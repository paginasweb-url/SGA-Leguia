import pool from '../config/db.js';

export const getStudents = async () => {
  const query = `
    SELECT
      e.id,
      e.user_id,
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
    FROM estudiantes e
    INNER JOIN users u
      ON e.user_id = u.id
    ORDER BY e.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getStudentById = async (id) => {
  const query = `
    SELECT
      e.id,
      e.user_id,
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
    FROM estudiantes e
    INNER JOIN users u
      ON e.user_id = u.id
    WHERE e.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createStudent = async (studentData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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
      codigo_estudiante,
      fecha_nacimiento,
      direccion,
      estado
    } = studentData;

    const userQuery = `
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,NOW())
      RETURNING id
    `;

    const userResult = await client.query(userQuery, [
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
    ]);

    const userId = userResult.rows[0].id;

    const studentQuery = `
      INSERT INTO estudiantes (
        user_id,
        codigo_estudiante,
        fecha_nacimiento,
        direccion,
        estado,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,NOW())
      RETURNING *
    `;

    const studentResult = await client.query(studentQuery, [
      userId,
      codigo_estudiante,
      fecha_nacimiento,
      direccion,
      estado
    ]);

    await client.query('COMMIT');

    return studentResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const updateStudent = async (id, studentData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      nombres,
      apellidos,
      telefono,
      codigo_estudiante,
      fecha_nacimiento,
      direccion,
      estado
    } = studentData;

    const studentResult = await client.query(
      `SELECT user_id FROM estudiantes WHERE id = $1`,
      [id]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('Estudiante no encontrado');
    }

    const userId = studentResult.rows[0].user_id;

    await client.query(
      `
      UPDATE users
      SET
        nombres = $1,
        apellidos = $2,
        telefono = $3,
        estado = $4
      WHERE id = $5
      `,
      [nombres, apellidos, telefono, estado, userId]
    );

    const updatedStudent = await client.query(
      `
      UPDATE estudiantes
      SET
        codigo_estudiante = $1,
        fecha_nacimiento = $2,
        direccion = $3,
        estado = $4
      WHERE id = $5
      RETURNING *
      `,
      [codigo_estudiante, fecha_nacimiento, direccion, estado, id]
    );

    await client.query('COMMIT');

    return updatedStudent.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const deactivateStudent = async (id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const studentResult = await client.query(
      `SELECT user_id FROM estudiantes WHERE id = $1`,
      [id]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('Estudiante no encontrado');
    }

    const userId = studentResult.rows[0].user_id;

    await client.query(
      `
      UPDATE users
      SET estado = 'inactivo'
      WHERE id = $1
      `,
      [userId]
    );

    const result = await client.query(
      `
      UPDATE estudiantes
      SET estado = 'inactivo'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    await client.query('COMMIT');

    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getStudentsForAuxiliary = async ({
  search,
  grado,
  aula_id,
  turno,
  estado = 'activo'
} = {}) => {
  const values = [];
  const conditions = [];

  if (estado) {
    values.push(estado);
    conditions.push(`e.estado = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`
      (
        u.nombres ILIKE $${values.length}
        OR u.apellidos ILIKE $${values.length}
        OR u.dni ILIKE $${values.length}
        OR e.codigo_estudiante ILIKE $${values.length}
      )
    `);
  }

  if (grado) {
    values.push(grado);
    conditions.push(`g.nombre = $${values.length}`);
  }

  if (aula_id) {
    values.push(aula_id);
    conditions.push(`a.id = $${values.length}`);
  }

  if (turno) {
    values.push(turno);
    conditions.push(`a.turno = $${values.length}`);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const query = `
    WITH latest_matricula AS (
      SELECT DISTINCT ON (m.estudiante_id)
        m.id,
        m.estudiante_id,
        m.aula_id,
        m.periodo_id,
        m.estado,
        m.fecha,
        m.created_at
      FROM matriculas m
      WHERE m.estado = 'aprobado'
      ORDER BY m.estudiante_id, m.created_at DESC, m.id DESC
    )
    SELECT
      e.id AS estudiante_id,
      e.user_id,
      e.codigo_estudiante,
      e.fecha_nacimiento,
      e.direccion,
      e.estado,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,

      lm.id AS matricula_id,
      lm.estado AS matricula_estado,
      lm.periodo_id,
      lm.fecha AS fecha_matricula,

      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,

      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'relacion_id', ea.id,
            'parentesco', ea.parentesco,
            'apoderado_id', ap.id,
            'nombres', uap.nombres,
            'apellidos', uap.apellidos,
            'dni', uap.dni,
            'telefono', uap.telefono,
            'correo', uap.correo
          )
        ) FILTER (WHERE ap.id IS NOT NULL),
        '[]'
      ) AS apoderados

    FROM estudiantes e
    INNER JOIN users u
      ON e.user_id = u.id

    LEFT JOIN latest_matricula lm
      ON lm.estudiante_id = e.id
    LEFT JOIN aulas a
      ON lm.aula_id = a.id
    LEFT JOIN grados g
      ON a.grado_id = g.id
    LEFT JOIN secciones s
      ON a.seccion_id = s.id

    LEFT JOIN estudiante_apoderado ea
      ON ea.estudiante_id = e.id
    LEFT JOIN apoderados ap
      ON ea.apoderado_id = ap.id
    LEFT JOIN users uap
      ON ap.user_id = uap.id

    ${whereClause}

    GROUP BY
      e.id,
      e.user_id,
      e.codigo_estudiante,
      e.fecha_nacimiento,
      e.direccion,
      e.estado,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      lm.id,
      lm.estado,
      lm.periodo_id,
      lm.fecha,
      a.id,
      g.nombre,
      s.nombre,
      a.turno

    ORDER BY
      g.nombre ASC NULLS LAST,
      s.nombre ASC NULLS LAST,
      a.turno ASC NULLS LAST,
      u.apellidos ASC,
      u.nombres ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};