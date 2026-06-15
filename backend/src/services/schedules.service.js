import pool from '../config/db.js';

export const getSchedules = async () => {
  const query = `
    SELECT
      h.id,
      h.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      h.curso_id,
      c.nombre AS curso,
      h.docente_id,
      u.nombres || ' ' || u.apellidos AS docente,
      h.dia_semana,
      h.hora_inicio,
      h.hora_fin,
      h.created_at
    FROM horarios h
    INNER JOIN aulas a
      ON h.aula_id = a.id
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    INNER JOIN cursos c
      ON h.curso_id = c.id
    INNER JOIN docentes d
      ON h.docente_id = d.id
    INNER JOIN users u
      ON d.user_id = u.id
    ORDER BY h.dia_semana ASC, h.hora_inicio ASC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getScheduleById = async (id) => {
  const query = `
    SELECT *
    FROM horarios
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const validateScheduleData = async (
  client,
  {
    aula_id,
    curso_id,
    docente_id,
    dia_semana,
    hora_inicio,
    hora_fin
  },
  scheduleId = null
) => {
  const allowedDays = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes'
  ];

  if (!allowedDays.includes(dia_semana)) {
    throw new Error('Día de semana no válido');
  }

  if (hora_inicio >= hora_fin) {
    throw new Error('La hora de inicio debe ser menor que la hora de fin');
  }

  const classroomResult = await client.query(
    `
    SELECT id, turno
    FROM aulas
    WHERE id = $1
    `,
    [aula_id]
  );

  if (classroomResult.rows.length === 0) {
    throw new Error('El aula no existe');
  }

  const classroomTurn = classroomResult.rows[0].turno;

  if (classroomTurn === 'Mañana') {
    if (hora_inicio < '07:00' || hora_fin > '13:30') {
      throw new Error('El horario no corresponde al turno mañana');
    }
  }

  if (classroomTurn === 'Tarde') {
    if (hora_inicio < '13:30' || hora_fin > '19:00') {
      throw new Error('El horario no corresponde al turno tarde');
    }
  }

  const courseResult = await client.query(
    `
    SELECT id
    FROM cursos
    WHERE id = $1
    `,
    [curso_id]
  );

  if (courseResult.rows.length === 0) {
    throw new Error('El curso no existe');
  }

  const teacherResult = await client.query(
    `
    SELECT d.id, u.estado
    FROM docentes d
    INNER JOIN users u ON d.user_id = u.id
    WHERE d.id = $1
    `,
    [docente_id]
  );

  if (teacherResult.rows.length === 0) {
    throw new Error('El docente no existe');
  }

  if (teacherResult.rows[0].estado !== 'activo') {
    throw new Error('El docente no está activo');
  }

  const excludeCurrent = scheduleId ? 'AND id <> $5' : '';

  const teacherConflictValues = scheduleId
    ? [docente_id, dia_semana, hora_inicio, hora_fin, scheduleId]
    : [docente_id, dia_semana, hora_inicio, hora_fin];

  const teacherConflict = await client.query(
    `
    SELECT id
    FROM horarios
    WHERE docente_id = $1
      AND dia_semana = $2
      AND hora_inicio < $4
      AND hora_fin > $3
      ${excludeCurrent}
    LIMIT 1
    `,
    teacherConflictValues
  );

  if (teacherConflict.rows.length > 0) {
    throw new Error('El docente ya tiene un horario asignado en ese rango');
  }

  const classroomConflictValues = scheduleId
    ? [aula_id, dia_semana, hora_inicio, hora_fin, scheduleId]
    : [aula_id, dia_semana, hora_inicio, hora_fin];

  const classroomExclude = scheduleId ? 'AND id <> $5' : '';

  const classroomConflict = await client.query(
    `
    SELECT id
    FROM horarios
    WHERE aula_id = $1
      AND dia_semana = $2
      AND hora_inicio < $4
      AND hora_fin > $3
      ${classroomExclude}
    LIMIT 1
    `,
    classroomConflictValues
  );

  if (classroomConflict.rows.length > 0) {
    throw new Error('El aula ya tiene un horario asignado en ese rango');
  }

  const duplicateCourse = await client.query(
    `
    SELECT id
    FROM horarios
    WHERE aula_id = $1
      AND curso_id = $2
      AND dia_semana = $3
      ${scheduleId ? 'AND id <> $4' : ''}
    LIMIT 1
    `,
    scheduleId
      ? [aula_id, curso_id, dia_semana, scheduleId]
      : [aula_id, curso_id, dia_semana]
  );

  if (duplicateCourse.rows.length > 0) {
    throw new Error('Ese curso ya está asignado a esa aula en el mismo día');
  }
};

export const createSchedule = async (data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await validateScheduleData(client, data);

    const {
      aula_id,
      curso_id,
      docente_id,
      dia_semana,
      hora_inicio,
      hora_fin
    } = data;

    const result = await client.query(
      `
      INSERT INTO horarios (
        aula_id,
        curso_id,
        docente_id,
        dia_semana,
        hora_inicio,
        hora_fin,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
      `,
      [aula_id, curso_id, docente_id, dia_semana, hora_inicio, hora_fin]
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

export const updateSchedule = async (id, data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await validateScheduleData(client, data, id);

    const {
      aula_id,
      curso_id,
      docente_id,
      dia_semana,
      hora_inicio,
      hora_fin
    } = data;

    const result = await client.query(
      `
      UPDATE horarios
      SET
        aula_id = $1,
        curso_id = $2,
        docente_id = $3,
        dia_semana = $4,
        hora_inicio = $5,
        hora_fin = $6
      WHERE id = $7
      RETURNING *
      `,
      [aula_id, curso_id, docente_id, dia_semana, hora_inicio, hora_fin, id]
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

export const deleteSchedule = async (id) => {
  const query = `
    DELETE FROM horarios
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const getSchedulesByClassroom = async (classroomId) => {
  const query = `
    SELECT
      h.id,
      h.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      h.curso_id,
      c.nombre AS curso,
      h.docente_id,
      u.nombres || ' ' || u.apellidos AS docente,
      h.dia_semana,
      h.hora_inicio,
      h.hora_fin
    FROM horarios h
    INNER JOIN aulas a
      ON h.aula_id = a.id
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    INNER JOIN cursos c
      ON h.curso_id = c.id
    INNER JOIN docentes d
      ON h.docente_id = d.id
    INNER JOIN users u
      ON d.user_id = u.id
    WHERE h.aula_id = $1
    ORDER BY h.dia_semana ASC, h.hora_inicio ASC
  `;

  const result = await pool.query(query, [classroomId]);
  return result.rows;
};

export const getSchedulesByTeacher = async (teacherId) => {
  const query = `
    SELECT
      h.id,
      h.aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      h.curso_id,
      c.nombre AS curso,
      h.docente_id,
      u.nombres || ' ' || u.apellidos AS docente,
      h.dia_semana,
      h.hora_inicio,
      h.hora_fin
    FROM horarios h
    INNER JOIN aulas a
      ON h.aula_id = a.id
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    INNER JOIN cursos c
      ON h.curso_id = c.id
    INNER JOIN docentes d
      ON h.docente_id = d.id
    INNER JOIN users u
      ON d.user_id = u.id
    WHERE h.docente_id = $1
    ORDER BY h.dia_semana ASC, h.hora_inicio ASC
  `;

  const result = await pool.query(query, [teacherId]);
  return result.rows;
};