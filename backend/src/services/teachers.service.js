import pool from '../config/db.js';

export const getTeachers = async () => {
  const query = `
    SELECT
      d.id,
      d.user_id,
      d.especialidad,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      u.estado
    FROM docentes d
    INNER JOIN users u
      ON d.user_id = u.id
    ORDER BY d.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getTeacherById = async (id) => {
  const query = `
    SELECT
      d.id,
      d.user_id,
      d.especialidad,
      u.nombres,
      u.apellidos,
      u.dni,
      u.username,
      u.correo,
      u.telefono,
      u.estado
    FROM docentes d
    INNER JOIN users u
      ON d.user_id = u.id
    WHERE d.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createTeacher = async (teacherData) => {
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
      estado,
      especialidad
    } = teacherData;

    const userResult = await client.query(
      `
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,NOW())
      RETURNING id
      `,
      [
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
      ]
    );

    const userId = userResult.rows[0].id;

    const teacherResult = await client.query(
      `
      INSERT INTO docentes (
        user_id,
        especialidad,
        created_at
      )
      VALUES ($1,$2,NOW())
      RETURNING *
      `,
      [userId, especialidad]
    );

    await client.query('COMMIT');

    return teacherResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const updateTeacher = async (id, teacherData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      nombres,
      apellidos,
      telefono,
      estado,
      especialidad
    } = teacherData;

    const teacherResult = await client.query(
      `SELECT user_id FROM docentes WHERE id = $1`,
      [id]
    );

    if (teacherResult.rows.length === 0) {
      throw new Error('Docente no encontrado');
    }

    const userId = teacherResult.rows[0].user_id;

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
      [
        nombres,
        apellidos,
        telefono,
        estado,
        userId
      ]
    );

    const updatedTeacher = await client.query(
      `
      UPDATE docentes
      SET especialidad = $1
      WHERE id = $2
      RETURNING *
      `,
      [especialidad, id]
    );

    await client.query('COMMIT');

    return updatedTeacher.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const deactivateTeacher = async (id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const teacherResult = await client.query(
      `SELECT user_id FROM docentes WHERE id = $1`,
      [id]
    );

    if (teacherResult.rows.length === 0) {
      throw new Error('Docente no encontrado');
    }

    const userId = teacherResult.rows[0].user_id;

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
      SELECT *
      FROM docentes
      WHERE id = $1
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