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