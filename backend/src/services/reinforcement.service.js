import pool from '../config/db.js';

const REINFORCEMENT_STATES = [
  'pendiente',
  'en_proceso',
  'completado',
  'cancelado'
];

const GUARDIAN_STATES = [
  'pendiente_apoderado',
  'aceptado',
  'rechazado'
];

const ATTENDANCE_STATES = [
  'presente',
  'falta',
  'tarde'
];

const getDateOnly = (value) => {
  if (!value) return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);

  if (match) return match[0];

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
};

const normalizeTime = (value) => {
  if (!value) return '';
  return String(value).trim().slice(0, 5);
};

const getDayName = (dateValue) => {
  const dateOnly = getDateOnly(dateValue);
  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha no válida');
  }

  const days = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ];

  const dayName = days[date.getDay()];

  if (dayName === 'Sábado' || dayName === 'Domingo') {
    throw new Error('Los reforzamientos solo pueden programarse de lunes a viernes');
  }

  return dayName;
};

const getOppositeShift = (turno) => {
  if (turno === 'Mañana') return 'Tarde';
  if (turno === 'Tarde') return 'Mañana';

  throw new Error('El aula origen debe tener turno Mañana o Tarde');
};

const formatDateForNotification = (value) => {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'fecha no registrada';

  const [year, month, day] = dateOnly.split('-');

  const months = [
    'ene.',
    'feb.',
    'mar.',
    'abr.',
    'may.',
    'jun.',
    'jul.',
    'ago.',
    'sep.',
    'oct.',
    'nov.',
    'dic.'
  ];

  return `${day} ${months[Number(month) - 1] || month} ${year}`;
};

const normalizeReinforcementPayload = (data = {}) => {
  const cursoId = Number(data.curso_id);
  const periodoId = Number(data.periodo_id);
  const aulaOrigenId = Number(data.aula_origen_id);
  const aulaReforzamientoId = Number(data.aula_reforzamiento_id);
  const docenteId = Number(data.docente_id);

  const fecha = getDateOnly(data.fecha);
  const horaInicio = normalizeTime(data.hora_inicio);
  const horaFin = normalizeTime(data.hora_fin);

  const titulo = String(data.titulo || '').trim();
  const descripcion = data.descripcion ? String(data.descripcion).trim() : null;
  const actividadRecomendada = data.actividad_recomendada
    ? String(data.actividad_recomendada).trim()
    : null;

  const origen = data.origen === 'alerta_academica'
    ? 'alerta_academica'
    : 'manual';

  const bimestre = data.bimestre ? String(data.bimestre).trim() : null;

  if (!cursoId || Number.isNaN(cursoId)) {
    throw new Error('El curso es obligatorio');
  }

  if (!periodoId || Number.isNaN(periodoId)) {
    throw new Error('El período académico es obligatorio');
  }

  if (!aulaOrigenId || Number.isNaN(aulaOrigenId)) {
    throw new Error('El aula de origen es obligatoria');
  }

  if (!aulaReforzamientoId || Number.isNaN(aulaReforzamientoId)) {
    throw new Error('El aula de reforzamiento es obligatoria');
  }

  if (!docenteId || Number.isNaN(docenteId)) {
    throw new Error('El docente asignado es obligatorio');
  }

  if (!titulo) {
    throw new Error('El título del reforzamiento es obligatorio');
  }

  if (titulo.length > 150) {
    throw new Error('El título no puede superar los 150 caracteres');
  }

  if (!fecha) {
    throw new Error('La fecha del reforzamiento es obligatoria');
  }

  if (!horaInicio || !horaFin) {
    throw new Error('La hora de inicio y fin son obligatorias');
  }

  if (horaInicio >= horaFin) {
    throw new Error('La hora de inicio debe ser menor que la hora fin');
  }

  return {
    origen,
    curso_id: cursoId,
    periodo_id: periodoId,
    bimestre,
    aula_origen_id: aulaOrigenId,
    aula_reforzamiento_id: aulaReforzamientoId,
    docente_id: docenteId,
    titulo,
    descripcion,
    actividad_recomendada: actividadRecomendada,
    fecha,
    dia_semana: getDayName(fecha),
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    notificar: data.notificar !== false
  };
};

const getClassroomById = async ({
  client,
  aulaId
}) => {
  const result = await client.query(
    `
    SELECT
      a.id,
      a.grado_id,
      a.seccion_id,
      a.turno,
      a.capacidad,
      a.estado,
      g.nombre AS grado,
      s.nombre AS seccion
    FROM aulas a
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    WHERE a.id = $1
    LIMIT 1
    `,
    [aulaId]
  );

  return result.rows[0] || null;
};

const validateTeacherCanTeachCourse = async ({
  client,
  docenteId,
  cursoId
}) => {
  const result = await client.query(
    `
    SELECT 1
    FROM docente_curso
    WHERE docente_id = $1
      AND curso_id = $2
    LIMIT 1
    `,
    [
      docenteId,
      cursoId
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('El docente asignado no tiene registrado ese curso');
  }
};

const validateTeacherAvailability = async ({
  client,
  docenteId,
  fecha,
  diaSemana,
  horaInicio,
  horaFin,
  ignoreReinforcementId = null
}) => {
  const regularConflict = await client.query(
    `
    SELECT id
    FROM horarios
    WHERE docente_id = $1
      AND dia_semana = $2
      AND hora_inicio < $4::time
      AND hora_fin > $3::time
    LIMIT 1
    `,
    [
      docenteId,
      diaSemana,
      horaInicio,
      horaFin
    ]
  );

  if (regularConflict.rows.length > 0) {
    throw new Error('El docente no está disponible en ese día y horario');
  }

  const reinforcementConflict = await client.query(
    `
    SELECT id
    FROM reforzamientos_academicos
    WHERE docente_id = $1
      AND fecha = $2::date
      AND estado IN ('pendiente', 'en_proceso')
      AND hora_inicio < $4::time
      AND hora_fin > $3::time
      AND ($5::int IS NULL OR id <> $5::int)
    LIMIT 1
    `,
    [
      docenteId,
      fecha,
      horaInicio,
      horaFin,
      ignoreReinforcementId
    ]
  );

  if (reinforcementConflict.rows.length > 0) {
    throw new Error('El docente ya tiene otro reforzamiento en ese horario');
  }
};

const validateClassroomAvailability = async ({
  client,
  aulaId,
  fecha,
  diaSemana,
  horaInicio,
  horaFin,
  ignoreReinforcementId = null
}) => {
  const regularConflict = await client.query(
    `
    SELECT id
    FROM horarios
    WHERE aula_id = $1
      AND dia_semana = $2
      AND hora_inicio < $4::time
      AND hora_fin > $3::time
    LIMIT 1
    `,
    [
      aulaId,
      diaSemana,
      horaInicio,
      horaFin
    ]
  );

  if (regularConflict.rows.length > 0) {
    throw new Error('El aula seleccionada no está disponible en ese día y horario');
  }

  const reinforcementConflict = await client.query(
    `
    SELECT id
    FROM reforzamientos_academicos
    WHERE aula_reforzamiento_id = $1
      AND fecha = $2::date
      AND estado IN ('pendiente', 'en_proceso')
      AND hora_inicio < $4::time
      AND hora_fin > $3::time
      AND ($5::int IS NULL OR id <> $5::int)
    LIMIT 1
    `,
    [
      aulaId,
      fecha,
      horaInicio,
      horaFin,
      ignoreReinforcementId
    ]
  );

  if (reinforcementConflict.rows.length > 0) {
    throw new Error('El aula ya tiene otro reforzamiento en ese horario');
  }
};

const validateStudentsForReinforcement = async ({
  client,
  estudiantes,
  aulaOrigenId,
  cursoId,
  periodoId,
  bimestre
}) => {
  if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
    throw new Error('Debes asignar al menos un estudiante al reforzamiento');
  }

  const ids = estudiantes.map((item) => Number(item.estudiante_id));

  if (ids.some((id) => !id || Number.isNaN(id))) {
    throw new Error('Todos los estudiantes asignados deben tener estudiante_id válido');
  }

  const result = await client.query(
    `
    SELECT
      e.id AS estudiante_id,
      e.user_id AS estudiante_user_id,
      u.nombres || ' ' || u.apellidos AS estudiante,
      u.dni,
      m.aula_id,
      m.periodo_id
    FROM estudiantes e
    INNER JOIN users u
      ON e.user_id = u.id
    INNER JOIN matriculas m
      ON m.estudiante_id = e.id
    WHERE e.id = ANY($1::int[])
      AND m.aula_id = $2
      AND m.periodo_id = $3
      AND m.estado = 'aprobado'
    `,
    [
      ids,
      aulaOrigenId,
      periodoId
    ]
  );

  if (result.rows.length !== ids.length) {
    throw new Error('Todos los estudiantes deben estar matriculados en el aula y período seleccionados');
  }

  for (const item of estudiantes) {
    if (item.alerta_academica_id) {
      const alertResult = await client.query(
        `
        SELECT id
        FROM alertas_academicas
        WHERE id = $1
          AND estudiante_id = $2
          AND curso_id = $3
          AND aula_id = $4
          AND periodo_id = $5
          AND ($6::varchar IS NULL OR bimestre = $6)
        LIMIT 1
        `,
        [
          Number(item.alerta_academica_id),
          Number(item.estudiante_id),
          cursoId,
          aulaOrigenId,
          periodoId,
          bimestre
        ]
      );

      if (alertResult.rows.length === 0) {
        throw new Error('Una de las alertas académicas seleccionadas no corresponde al reforzamiento');
      }
    }
  }

  return result.rows;
};

const getPrimaryGuardianForStudent = async ({
  client,
  estudianteId
}) => {
  const result = await client.query(
    `
    SELECT
      ap.id AS apoderado_id,
      ap.user_id
    FROM estudiante_apoderado ea
    INNER JOIN apoderados ap
      ON ea.apoderado_id = ap.id
    WHERE ea.estudiante_id = $1
    ORDER BY ea.id ASC
    LIMIT 1
    `,
    [estudianteId]
  );

  return result.rows[0] || null;
};

const validateReinforcementPayload = async ({
  client,
  payload,
  estudiantes = [],
  ignoreReinforcementId = null,
  validateStudents = true
}) => {
  const originClassroom = await getClassroomById({
    client,
    aulaId: payload.aula_origen_id
  });

  if (!originClassroom) {
    throw new Error('El aula de origen no existe');
  }

  const reinforcementClassroom = await getClassroomById({
    client,
    aulaId: payload.aula_reforzamiento_id
  });

  if (!reinforcementClassroom) {
    throw new Error('El aula de reforzamiento no existe');
  }

  if (originClassroom.estado !== 'activo') {
    throw new Error('El aula de origen no está activa');
  }

  if (reinforcementClassroom.estado !== 'activo') {
    throw new Error('El aula de reforzamiento no está activa');
  }

  const turnoRefuerzo = getOppositeShift(originClassroom.turno);

  if (reinforcementClassroom.turno !== turnoRefuerzo) {
    throw new Error(
      `Los estudiantes de turno ${originClassroom.turno} solo pueden recibir reforzamiento en turno ${turnoRefuerzo}`
    );
  }

  const courseResult = await client.query(
    `
    SELECT id
    FROM cursos
    WHERE id = $1
    LIMIT 1
    `,
    [payload.curso_id]
  );

  if (courseResult.rows.length === 0) {
    throw new Error('El curso seleccionado no existe');
  }

  const periodResult = await client.query(
    `
    SELECT id
    FROM periodos_academicos
    WHERE id = $1
    LIMIT 1
    `,
    [payload.periodo_id]
  );

  if (periodResult.rows.length === 0) {
    throw new Error('El período académico seleccionado no existe');
  }

  const teacherResult = await client.query(
    `
    SELECT id
    FROM docentes
    WHERE id = $1
    LIMIT 1
    `,
    [payload.docente_id]
  );

  if (teacherResult.rows.length === 0) {
    throw new Error('El docente seleccionado no existe');
  }

  await validateTeacherCanTeachCourse({
    client,
    docenteId: payload.docente_id,
    cursoId: payload.curso_id
  });

  await validateTeacherAvailability({
    client,
    docenteId: payload.docente_id,
    fecha: payload.fecha,
    diaSemana: payload.dia_semana,
    horaInicio: payload.hora_inicio,
    horaFin: payload.hora_fin,
    ignoreReinforcementId
  });

  await validateClassroomAvailability({
    client,
    aulaId: payload.aula_reforzamiento_id,
    fecha: payload.fecha,
    diaSemana: payload.dia_semana,
    horaInicio: payload.hora_inicio,
    horaFin: payload.hora_fin,
    ignoreReinforcementId
  });

  if (validateStudents) {
    const students = await validateStudentsForReinforcement({
      client,
      estudiantes,
      aulaOrigenId: payload.aula_origen_id,
      cursoId: payload.curso_id,
      periodoId: payload.periodo_id,
      bimestre: payload.bimestre
    });

    if (Number(reinforcementClassroom.capacidad || 0) > 0 && students.length > Number(reinforcementClassroom.capacidad)) {
      throw new Error('La cantidad de estudiantes supera la capacidad del aula de reforzamiento');
    }

    return {
      originClassroom,
      reinforcementClassroom,
      turnoRefuerzo,
      students
    };
  }

  return {
    originClassroom,
    reinforcementClassroom,
    turnoRefuerzo,
    students: []
  };
};

const createReinforcementNotifications = async ({
  client,
  reinforcementId
}) => {
  const reinforcementResult = await client.query(
    `
    SELECT
      ra.id,
      ra.titulo,
      ra.fecha,
      ra.hora_inicio,
      ra.hora_fin,
      c.nombre AS curso,
      d.user_id AS docente_user_id
    FROM reforzamientos_academicos ra
    INNER JOIN cursos c
      ON ra.curso_id = c.id
    INNER JOIN docentes d
      ON ra.docente_id = d.id
    WHERE ra.id = $1
    LIMIT 1
    `,
    [reinforcementId]
  );

  const reinforcement = reinforcementResult.rows[0];

  if (!reinforcement) {
    return 0;
  }

  const recipientsResult = await client.query(
    `
    SELECT DISTINCT user_id
    FROM (
      SELECT
        e.user_id AS user_id
      FROM reforzamiento_estudiantes re
      INNER JOIN estudiantes e
        ON re.estudiante_id = e.id
      WHERE re.reforzamiento_id = $1
        AND e.user_id IS NOT NULL

      UNION

      SELECT
        ap.user_id AS user_id
      FROM reforzamiento_estudiantes re
      INNER JOIN estudiante_apoderado ea
        ON ea.estudiante_id = re.estudiante_id
      INNER JOIN apoderados ap
        ON ea.apoderado_id = ap.id
      WHERE re.reforzamiento_id = $1
        AND ap.user_id IS NOT NULL

      UNION

      SELECT
        d.user_id AS user_id
      FROM reforzamientos_academicos ra
      INNER JOIN docentes d
        ON ra.docente_id = d.id
      WHERE ra.id = $1
        AND d.user_id IS NOT NULL
    ) recipients
    INNER JOIN users u
      ON recipients.user_id = u.id
    WHERE COALESCE(u.estado, 'activo') = 'activo'
    `,
    [reinforcementId]
  );

  const fechaTexto = formatDateForNotification(reinforcement.fecha);

  const mensaje = `Se registró un reforzamiento académico de ${reinforcement.curso} para el ${fechaTexto}, de ${normalizeTime(reinforcement.hora_inicio)} a ${normalizeTime(reinforcement.hora_fin)}.`;

  let total = 0;

  for (const recipient of recipientsResult.rows) {
    await client.query(
      `
      INSERT INTO notificaciones (
        user_id,
        tipo,
        mensaje,
        estado,
        fecha,
        created_at
      )
      VALUES ($1, 'reforzamiento_academico', $2, 'no_leida', NOW(), NOW())
      `,
      [
        recipient.user_id,
        mensaje
      ]
    );

    total += 1;
  }

  return total;
};

const canAccessReinforcement = async ({
  id,
  userId,
  rol
}) => {
  if (['Director', 'Administrativo', 'Auxiliar'].includes(rol)) {
    return true;
  }

  if (rol === 'Docente') {
    const result = await pool.query(
      `
      SELECT 1
      FROM reforzamientos_academicos ra
      INNER JOIN docentes d
        ON ra.docente_id = d.id
      WHERE ra.id = $1
        AND d.user_id = $2
      LIMIT 1
      `,
      [
        id,
        userId
      ]
    );

    return result.rows.length > 0;
  }

  if (rol === 'Estudiante') {
    const result = await pool.query(
      `
      SELECT 1
      FROM reforzamiento_estudiantes re
      INNER JOIN estudiantes e
        ON re.estudiante_id = e.id
      WHERE re.reforzamiento_id = $1
        AND e.user_id = $2
      LIMIT 1
      `,
      [
        id,
        userId
      ]
    );

    return result.rows.length > 0;
  }

  if (rol === 'Apoderado') {
    const result = await pool.query(
      `
      SELECT 1
      FROM reforzamiento_estudiantes re
      INNER JOIN estudiante_apoderado ea
        ON ea.estudiante_id = re.estudiante_id
      INNER JOIN apoderados ap
        ON ea.apoderado_id = ap.id
      WHERE re.reforzamiento_id = $1
        AND ap.user_id = $2
      LIMIT 1
      `,
      [
        id,
        userId
      ]
    );

    return result.rows.length > 0;
  }

  return false;
};

export const getReinforcements = async ({
  userId,
  rol,
  estado,
  desde,
  hasta,
  curso_id
} = {}) => {
  const values = [];

  let query = `
    SELECT
      ra.id,
      ra.origen,
      ra.curso_id,
      ra.periodo_id,
      ra.bimestre,
      ra.aula_origen_id,
      ra.aula_reforzamiento_id,
      ra.docente_id,
      ra.titulo,
      ra.descripcion,
      ra.actividad_recomendada,
      ra.turno_origen,
      ra.turno_reforzamiento,
      ra.fecha,
      ra.dia_semana,
      ra.hora_inicio,
      ra.hora_fin,
      ra.estado,
      ra.notificar,
      ra.created_at,
      ra.updated_at,

      c.nombre AS curso,
      p.nombre AS periodo,

      go.nombre AS grado_origen,
      so.nombre AS seccion_origen,
      ao.turno AS turno_aula_origen,

      gr.nombre AS grado_reforzamiento,
      sr.nombre AS seccion_reforzamiento,
      ar.turno AS turno_aula_reforzamiento,

      ud.nombres || ' ' || ud.apellidos AS docente,
      uc.nombres || ' ' || uc.apellidos AS creado_por_nombre,

      (
        SELECT COUNT(*)::int
        FROM reforzamiento_estudiantes re
        WHERE re.reforzamiento_id = ra.id
      ) AS total_estudiantes,

      (
        SELECT COUNT(*)::int
        FROM reforzamiento_estudiantes re
        WHERE re.reforzamiento_id = ra.id
          AND re.estado_apoderado = 'aceptado'
      ) AS total_aceptados,

      (
        SELECT COUNT(*)::int
        FROM reforzamiento_estudiantes re
        WHERE re.reforzamiento_id = ra.id
          AND re.estado_apoderado = 'pendiente_apoderado'
      ) AS total_pendientes_apoderado,

      (
        SELECT COUNT(*)::int
        FROM reforzamiento_estudiantes re
        WHERE re.reforzamiento_id = ra.id
          AND re.estado_apoderado = 'rechazado'
      ) AS total_rechazados,

      (
        SELECT COUNT(*)::int
        FROM asistencias_reforzamiento arx
        WHERE arx.reforzamiento_id = ra.id
      ) AS total_asistencias_registradas

    FROM reforzamientos_academicos ra
    INNER JOIN cursos c
      ON ra.curso_id = c.id
    INNER JOIN periodos_academicos p
      ON ra.periodo_id = p.id
    INNER JOIN aulas ao
      ON ra.aula_origen_id = ao.id
    INNER JOIN grados go
      ON ao.grado_id = go.id
    INNER JOIN secciones so
      ON ao.seccion_id = so.id
    INNER JOIN aulas ar
      ON ra.aula_reforzamiento_id = ar.id
    INNER JOIN grados gr
      ON ar.grado_id = gr.id
    INNER JOIN secciones sr
      ON ar.seccion_id = sr.id
    INNER JOIN docentes d
      ON ra.docente_id = d.id
    INNER JOIN users ud
      ON d.user_id = ud.id
    INNER JOIN users uc
      ON ra.creado_por = uc.id
    WHERE 1 = 1
  `;

  if (estado && estado !== 'todos') {
    if (!REINFORCEMENT_STATES.includes(estado)) {
      throw new Error('Estado de reforzamiento no válido');
    }

    values.push(estado);

    query += `
      AND ra.estado = $${values.length}
    `;
  }

  if (desde) {
    values.push(getDateOnly(desde));

    query += `
      AND ra.fecha >= $${values.length}::date
    `;
  }

  if (hasta) {
    values.push(getDateOnly(hasta));

    query += `
      AND ra.fecha <= $${values.length}::date
    `;
  }

  if (curso_id) {
    values.push(Number(curso_id));

    query += `
      AND ra.curso_id = $${values.length}
    `;
  }

  if (rol === 'Docente') {
    values.push(userId);

    query += `
      AND EXISTS (
        SELECT 1
        FROM docentes dx
        WHERE dx.id = ra.docente_id
          AND dx.user_id = $${values.length}
      )
    `;
  }

  if (rol === 'Estudiante') {
    values.push(userId);

    query += `
      AND EXISTS (
        SELECT 1
        FROM reforzamiento_estudiantes re
        INNER JOIN estudiantes e
          ON re.estudiante_id = e.id
        WHERE re.reforzamiento_id = ra.id
          AND e.user_id = $${values.length}
      )
    `;
  }

  if (rol === 'Apoderado') {
    values.push(userId);

    query += `
      AND EXISTS (
        SELECT 1
        FROM reforzamiento_estudiantes re
        INNER JOIN estudiante_apoderado ea
          ON ea.estudiante_id = re.estudiante_id
        INNER JOIN apoderados ap
          ON ea.apoderado_id = ap.id
        WHERE re.reforzamiento_id = ra.id
          AND ap.user_id = $${values.length}
      )
    `;
  }

  query += `
    ORDER BY
      CASE
        WHEN ra.estado = 'pendiente' THEN 0
        WHEN ra.estado = 'en_proceso' THEN 1
        WHEN ra.estado = 'completado' THEN 2
        ELSE 3
      END,
      ra.fecha ASC,
      ra.hora_inicio ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getReinforcementById = async ({
  id,
  userId,
  rol
}) => {
  const allowed = await canAccessReinforcement({
    id,
    userId,
    rol
  });

  if (!allowed) {
    throw new Error('No tienes acceso a este reforzamiento');
  }

  const headerResult = await pool.query(
    `
    SELECT
      ra.*,
      c.nombre AS curso,
      p.nombre AS periodo,

      go.nombre AS grado_origen,
      so.nombre AS seccion_origen,

      gr.nombre AS grado_reforzamiento,
      sr.nombre AS seccion_reforzamiento,

      ud.nombres || ' ' || ud.apellidos AS docente,
      ud.dni AS docente_dni,

      uc.nombres || ' ' || uc.apellidos AS creado_por_nombre
    FROM reforzamientos_academicos ra
    INNER JOIN cursos c
      ON ra.curso_id = c.id
    INNER JOIN periodos_academicos p
      ON ra.periodo_id = p.id
    INNER JOIN aulas ao
      ON ra.aula_origen_id = ao.id
    INNER JOIN grados go
      ON ao.grado_id = go.id
    INNER JOIN secciones so
      ON ao.seccion_id = so.id
    INNER JOIN aulas ar
      ON ra.aula_reforzamiento_id = ar.id
    INNER JOIN grados gr
      ON ar.grado_id = gr.id
    INNER JOIN secciones sr
      ON ar.seccion_id = sr.id
    INNER JOIN docentes d
      ON ra.docente_id = d.id
    INNER JOIN users ud
      ON d.user_id = ud.id
    INNER JOIN users uc
      ON ra.creado_por = uc.id
    WHERE ra.id = $1
    LIMIT 1
    `,
    [id]
  );

  if (headerResult.rows.length === 0) {
    throw new Error('El reforzamiento no existe');
  }

  const studentsResult = await pool.query(
    `
    SELECT
      re.id AS reforzamiento_estudiante_id,
      re.estudiante_id,
      re.alerta_academica_id,
      re.apoderado_id,
      re.estado_apoderado,
      re.respuesta_apoderado,
      re.fecha_respuesta,
      re.created_at,

      ue.nombres || ' ' || ue.apellidos AS estudiante,
      ue.dni AS estudiante_dni,
      e.codigo_estudiante,

      uap.nombres || ' ' || uap.apellidos AS apoderado,

      ar.id AS asistencia_id,
      ar.estado AS estado_asistencia,
      ar.observacion AS observacion_asistencia,
      ar.created_at AS fecha_asistencia
    FROM reforzamiento_estudiantes re
    INNER JOIN estudiantes e
      ON re.estudiante_id = e.id
    INNER JOIN users ue
      ON e.user_id = ue.id
    LEFT JOIN apoderados ap
      ON re.apoderado_id = ap.id
    LEFT JOIN users uap
      ON ap.user_id = uap.id
    LEFT JOIN asistencias_reforzamiento ar
      ON ar.reforzamiento_estudiante_id = re.id
    WHERE re.reforzamiento_id = $1
    ORDER BY ue.apellidos ASC, ue.nombres ASC
    `,
    [id]
  );

  return {
    ...headerResult.rows[0],
    estudiantes: studentsResult.rows
  };
};

export const getReinforcementCandidates = async ({
  aula_origen_id,
  curso_id,
  periodo_id,
  bimestre
}) => {
  if (!aula_origen_id || !curso_id || !periodo_id) {
    throw new Error('Debes enviar aula_origen_id, curso_id y periodo_id');
  }

  const result = await pool.query(
    `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres || ' ' || u.apellidos AS estudiante,
      u.dni,

      n.id AS nota_id,
      n.nota,
      n.comentario,

      aa.id AS alerta_academica_id,
      aa.estado AS estado_alerta,
      aa.mensaje AS mensaje_alerta
    FROM matriculas m
    INNER JOIN estudiantes e
      ON m.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    LEFT JOIN notas n
      ON n.estudiante_id = e.id
     AND n.curso_id = $2
     AND n.aula_id = $1
     AND n.periodo_id = $3
     AND ($4::varchar IS NULL OR n.bimestre = $4)
    LEFT JOIN alertas_academicas aa
      ON aa.estudiante_id = e.id
     AND aa.curso_id = $2
     AND aa.aula_id = $1
     AND aa.periodo_id = $3
     AND ($4::varchar IS NULL OR aa.bimestre = $4)
     AND aa.estado = 'activa'
    WHERE m.aula_id = $1
      AND m.periodo_id = $3
      AND m.estado = 'aprobado'
    ORDER BY
      CASE WHEN aa.id IS NOT NULL THEN 0 ELSE 1 END,
      u.apellidos ASC,
      u.nombres ASC
    `,
    [
      aula_origen_id,
      curso_id,
      periodo_id,
      bimestre || null
    ]
  );

  return result.rows;
};

export const getAvailableReinforcementTeachers = async ({
  curso_id,
  fecha,
  hora_inicio,
  hora_fin
}) => {
  if (!curso_id) {
    throw new Error('Debes enviar curso_id');
  }

  const values = [Number(curso_id)];
  const dateOnly = fecha ? getDateOnly(fecha) : null;
  const start = hora_inicio ? normalizeTime(hora_inicio) : null;
  const end = hora_fin ? normalizeTime(hora_fin) : null;
  const dayName = dateOnly ? getDayName(dateOnly) : null;

  let query = `
    SELECT DISTINCT
      d.id AS docente_id,
      u.nombres || ' ' || u.apellidos AS docente,
      u.dni,
      d.especialidad
    FROM docentes d
    INNER JOIN users u
      ON d.user_id = u.id
    INNER JOIN docente_curso dc
      ON dc.docente_id = d.id
    WHERE dc.curso_id = $1
      AND COALESCE(u.estado, 'activo') = 'activo'
  `;

  if (dateOnly && start && end) {
    values.push(dayName, start, end, dateOnly);

    query += `
      AND NOT EXISTS (
        SELECT 1
        FROM horarios h
        WHERE h.docente_id = d.id
          AND h.dia_semana = $2
          AND h.hora_inicio < $4::time
          AND h.hora_fin > $3::time
      )
      AND NOT EXISTS (
        SELECT 1
        FROM reforzamientos_academicos ra
        WHERE ra.docente_id = d.id
          AND ra.fecha = $5::date
          AND ra.estado IN ('pendiente', 'en_proceso')
          AND ra.hora_inicio < $4::time
          AND ra.hora_fin > $3::time
      )
    `;
  }

  query += `
    ORDER BY docente ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getAvailableReinforcementClassrooms = async ({
  turno,
  fecha,
  hora_inicio,
  hora_fin
}) => {
  if (!turno) {
    throw new Error('Debes enviar el turno del reforzamiento');
  }

  const values = [turno];
  const dateOnly = fecha ? getDateOnly(fecha) : null;
  const start = hora_inicio ? normalizeTime(hora_inicio) : null;
  const end = hora_fin ? normalizeTime(hora_fin) : null;
  const dayName = dateOnly ? getDayName(dateOnly) : null;

  let query = `
    SELECT
      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      a.capacidad
    FROM aulas a
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    WHERE a.turno = $1
      AND COALESCE(a.estado, 'activo') = 'activo'
  `;

  if (dateOnly && start && end) {
    values.push(dayName, start, end, dateOnly);

    query += `
      AND NOT EXISTS (
        SELECT 1
        FROM horarios h
        WHERE h.aula_id = a.id
          AND h.dia_semana = $2
          AND h.hora_inicio < $4::time
          AND h.hora_fin > $3::time
      )
      AND NOT EXISTS (
        SELECT 1
        FROM reforzamientos_academicos ra
        WHERE ra.aula_reforzamiento_id = a.id
          AND ra.fecha = $5::date
          AND ra.estado IN ('pendiente', 'en_proceso')
          AND ra.hora_inicio < $4::time
          AND ra.hora_fin > $3::time
      )
    `;
  }

  query += `
    ORDER BY
      g.nombre ASC,
      s.nombre ASC,
      a.turno ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const createReinforcement = async ({
  data,
  userId
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const payload = normalizeReinforcementPayload(data);
    const estudiantes = data.estudiantes || [];

    const validation = await validateReinforcementPayload({
      client,
      payload,
      estudiantes,
      validateStudents: true
    });

    const result = await client.query(
      `
      INSERT INTO reforzamientos_academicos (
        origen,
        curso_id,
        periodo_id,
        bimestre,
        aula_origen_id,
        aula_reforzamiento_id,
        docente_id,
        titulo,
        descripcion,
        actividad_recomendada,
        turno_origen,
        turno_reforzamiento,
        fecha,
        dia_semana,
        hora_inicio,
        hora_fin,
        estado,
        notificar,
        creado_por,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,'pendiente',$17,$18,NOW(),NOW()
      )
      RETURNING *
      `,
      [
        payload.origen,
        payload.curso_id,
        payload.periodo_id,
        payload.bimestre,
        payload.aula_origen_id,
        payload.aula_reforzamiento_id,
        payload.docente_id,
        payload.titulo,
        payload.descripcion,
        payload.actividad_recomendada,
        validation.originClassroom.turno,
        validation.turnoRefuerzo,
        payload.fecha,
        payload.dia_semana,
        payload.hora_inicio,
        payload.hora_fin,
        payload.notificar,
        userId
      ]
    );

    const reinforcement = result.rows[0];

    for (const item of estudiantes) {
      const guardian = await getPrimaryGuardianForStudent({
        client,
        estudianteId: Number(item.estudiante_id)
      });

      await client.query(
        `
        INSERT INTO reforzamiento_estudiantes (
          reforzamiento_id,
          estudiante_id,
          alerta_academica_id,
          apoderado_id,
          estado_apoderado,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,'pendiente_apoderado',NOW(),NOW())
        `,
        [
          reinforcement.id,
          Number(item.estudiante_id),
          item.alerta_academica_id ? Number(item.alerta_academica_id) : null,
          guardian?.apoderado_id || null
        ]
      );
    }

    let notificationsCreated = 0;

    if (payload.notificar) {
      notificationsCreated = await createReinforcementNotifications({
        client,
        reinforcementId: reinforcement.id
      });
    }

    await client.query('COMMIT');

    return {
      reinforcement,
      notificaciones_generadas: notificationsCreated
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const updateReinforcement = async ({
  id,
  data,
  userId
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query(
      `
      SELECT *
      FROM reforzamientos_academicos
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('El reforzamiento no existe');
    }

    const current = currentResult.rows[0];

    if (['completado', 'cancelado'].includes(current.estado)) {
      throw new Error('No se puede editar un reforzamiento completado o cancelado');
    }

    const payload = normalizeReinforcementPayload({
      ...current,
      ...data
    });

    const validation = await validateReinforcementPayload({
      client,
      payload,
      ignoreReinforcementId: Number(id),
      validateStudents: false
    });

    const result = await client.query(
      `
      UPDATE reforzamientos_academicos
      SET
        origen = $2,
        curso_id = $3,
        periodo_id = $4,
        bimestre = $5,
        aula_origen_id = $6,
        aula_reforzamiento_id = $7,
        docente_id = $8,
        titulo = $9,
        descripcion = $10,
        actividad_recomendada = $11,
        turno_origen = $12,
        turno_reforzamiento = $13,
        fecha = $14,
        dia_semana = $15,
        hora_inicio = $16,
        hora_fin = $17,
        notificar = $18,
        actualizado_por = $19,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        payload.origen,
        payload.curso_id,
        payload.periodo_id,
        payload.bimestre,
        payload.aula_origen_id,
        payload.aula_reforzamiento_id,
        payload.docente_id,
        payload.titulo,
        payload.descripcion,
        payload.actividad_recomendada,
        validation.originClassroom.turno,
        validation.turnoRefuerzo,
        payload.fecha,
        payload.dia_semana,
        payload.hora_inicio,
        payload.hora_fin,
        payload.notificar,
        userId
      ]
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

export const cancelReinforcement = async ({
  id,
  userId,
  motivo
}) => {
  const result = await pool.query(
    `
    UPDATE reforzamientos_academicos
    SET
      estado = 'cancelado',
      cancelado_por = $2,
      fecha_cancelacion = NOW(),
      motivo_cancelacion = $3,
      updated_at = NOW()
    WHERE id = $1
      AND estado NOT IN ('completado', 'cancelado')
    RETURNING *
    `,
    [
      id,
      userId,
      motivo || 'Reforzamiento cancelado.'
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('El reforzamiento no existe o ya fue completado/cancelado');
  }

  return result.rows[0];
};

export const completeReinforcement = async ({
  id,
  userId,
  observacion
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
      UPDATE reforzamientos_academicos
      SET
        estado = 'completado',
        completado_por = $2,
        fecha_completado = NOW(),
        observacion_cierre = $3,
        updated_at = NOW()
      WHERE id = $1
        AND estado NOT IN ('completado', 'cancelado')
      RETURNING *
      `,
      [
        id,
        userId,
        observacion || 'Reforzamiento académico completado.'
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('El reforzamiento no existe o ya fue completado/cancelado');
    }

    await client.query(
      `
      UPDATE alertas_academicas aa
      SET
        estado = 'resuelta',
        resuelta_por = $2,
        fecha_resolucion = NOW(),
        observacion_resolucion = $3,
        updated_at = NOW()
      FROM reforzamiento_estudiantes re
      WHERE re.reforzamiento_id = $1
        AND re.alerta_academica_id = aa.id
        AND aa.estado = 'activa'
      `,
      [
        id,
        userId,
        'Alerta resuelta automáticamente por culminación del reforzamiento académico.'
      ]
    );

    await client.query(
      `
      UPDATE alertas_academicas aa
      SET
        estado = 'resuelta',
        resuelta_por = $2,
        fecha_resolucion = NOW(),
        observacion_resolucion = $3,
        updated_at = NOW()
      FROM reforzamiento_estudiantes re
      INNER JOIN reforzamientos_academicos ra
        ON re.reforzamiento_id = ra.id
      WHERE ra.id = $1
        AND aa.estudiante_id = re.estudiante_id
        AND aa.curso_id = ra.curso_id
        AND aa.aula_id = ra.aula_origen_id
        AND aa.periodo_id = ra.periodo_id
        AND (ra.bimestre IS NULL OR aa.bimestre = ra.bimestre)
        AND aa.estado = 'activa'
      `,
      [
        id,
        userId,
        'Alerta resuelta automáticamente por culminación del reforzamiento académico.'
      ]
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

export const respondReinforcementStudent = async ({
  assignmentId,
  userId,
  estado,
  respuesta
}) => {
  if (!['aceptado', 'rechazado'].includes(estado)) {
    throw new Error('La respuesta debe ser aceptado o rechazado');
  }

  const validation = await pool.query(
    `
    SELECT
      re.id,
      re.estado_apoderado,
      ra.estado AS estado_reforzamiento
    FROM reforzamiento_estudiantes re
    INNER JOIN reforzamientos_academicos ra
      ON re.reforzamiento_id = ra.id
    INNER JOIN estudiante_apoderado ea
      ON ea.estudiante_id = re.estudiante_id
    INNER JOIN apoderados ap
      ON ea.apoderado_id = ap.id
    WHERE re.id = $1
      AND ap.user_id = $2
    LIMIT 1
    `,
    [
      assignmentId,
      userId
    ]
  );

  if (validation.rows.length === 0) {
    throw new Error('No tienes permiso para responder este reforzamiento');
  }

  if (['completado', 'cancelado'].includes(validation.rows[0].estado_reforzamiento)) {
    throw new Error('No se puede responder un reforzamiento completado o cancelado');
  }

  const result = await pool.query(
    `
    UPDATE reforzamiento_estudiantes
    SET
      estado_apoderado = $2,
      respondido_por = $3,
      respuesta_apoderado = $4,
      fecha_respuesta = NOW(),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      assignmentId,
      estado,
      userId,
      respuesta || null
    ]
  );

  return result.rows[0];
};

export const saveReinforcementAttendance = async ({
  reinforcementId,
  asistencias,
  userId
}) => {
  if (!Array.isArray(asistencias) || asistencias.length === 0) {
    throw new Error('Debes enviar al menos una asistencia');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const reinforcementResult = await client.query(
      `
      SELECT id, estado
      FROM reforzamientos_academicos
      WHERE id = $1
      LIMIT 1
      `,
      [reinforcementId]
    );

    if (reinforcementResult.rows.length === 0) {
      throw new Error('El reforzamiento no existe');
    }

    if (['completado', 'cancelado'].includes(reinforcementResult.rows[0].estado)) {
      throw new Error('No se puede registrar asistencia en un reforzamiento completado o cancelado');
    }

    let total = 0;

    for (const item of asistencias) {
      const estado = String(item.estado || '').trim();

      if (!ATTENDANCE_STATES.includes(estado)) {
        throw new Error('Estado de asistencia no válido');
      }

      const assignmentResult = await client.query(
        `
        SELECT
          id,
          estudiante_id,
          estado_apoderado
        FROM reforzamiento_estudiantes
        WHERE id = $1
          AND reforzamiento_id = $2
        LIMIT 1
        `,
        [
          Number(item.reforzamiento_estudiante_id),
          reinforcementId
        ]
      );

      if (assignmentResult.rows.length === 0) {
        throw new Error('Uno de los estudiantes no pertenece al reforzamiento');
      }

      const assignment = assignmentResult.rows[0];

      if (assignment.estado_apoderado !== 'aceptado') {
        throw new Error('Solo se puede registrar asistencia a estudiantes aceptados por el apoderado');
      }

      await client.query(
        `
        INSERT INTO asistencias_reforzamiento (
          reforzamiento_id,
          reforzamiento_estudiante_id,
          estudiante_id,
          estado,
          observacion,
          registrado_por,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
        ON CONFLICT (reforzamiento_estudiante_id)
        DO UPDATE SET
          estado = EXCLUDED.estado,
          observacion = EXCLUDED.observacion,
          registrado_por = EXCLUDED.registrado_por,
          updated_at = NOW()
        `,
        [
          reinforcementId,
          assignment.id,
          assignment.estudiante_id,
          estado,
          item.observacion || null,
          userId
        ]
      );

      total += 1;
    }

    await client.query(
      `
      UPDATE reforzamientos_academicos
      SET
        estado = CASE
          WHEN estado = 'pendiente' THEN 'en_proceso'
          ELSE estado
        END,
        updated_at = NOW()
      WHERE id = $1
      `,
      [reinforcementId]
    );

    await client.query('COMMIT');

    return {
      reforzamiento_id: reinforcementId,
      total_registros: total
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};