import pool from '../config/db.js';

const EVENT_TYPES = [
  'bimestre',
  'evaluacion',
  'reunion',
  'actividad',
  'feriado',
  'entrega_notas',
  'otro'
];

const EVENT_SCOPES = ['general', 'aula'];
const EVENT_STATES = ['activo', 'cancelado'];

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

const normalizeBoolean = (value) => {
  return value === true || value === 'true' || value === 1 || value === '1';
};

const normalizeEventPayload = (data = {}) => {
  const titulo = String(data.titulo || '').trim();
  const descripcion = data.descripcion ? String(data.descripcion).trim() : null;
  const tipo_evento = String(data.tipo_evento || '').trim();
  const alcance = String(data.alcance || 'general').trim();

  const fecha_inicio = getDateOnly(data.fecha_inicio);
  const fecha_fin = data.fecha_fin ? getDateOnly(data.fecha_fin) : null;

  const hora_inicio = data.hora_inicio ? String(data.hora_inicio).trim() : null;
  const hora_fin = data.hora_fin ? String(data.hora_fin).trim() : null;

  const aula_id = alcance === 'aula'
    ? Number(data.aula_id)
    : null;

  if (!titulo) {
    throw new Error('El título del evento es obligatorio');
  }

  if (titulo.length > 150) {
    throw new Error('El título no puede superar los 150 caracteres');
  }

  if (!EVENT_TYPES.includes(tipo_evento)) {
    throw new Error('Tipo de evento no válido');
  }

  if (!EVENT_SCOPES.includes(alcance)) {
    throw new Error('Alcance de evento no válido');
  }

  if (alcance === 'aula' && (!aula_id || Number.isNaN(aula_id))) {
    throw new Error('Debes seleccionar un aula para eventos por aula');
  }

  if (alcance === 'general' && data.aula_id) {
    throw new Error('Un evento general no debe tener aula asignada');
  }

  if (!fecha_inicio) {
    throw new Error('La fecha de inicio es obligatoria');
  }

  if (fecha_fin && fecha_fin < fecha_inicio) {
    throw new Error('La fecha fin no puede ser menor que la fecha de inicio');
  }

  return {
    titulo,
    descripcion,
    tipo_evento,
    alcance,
    aula_id,
    fecha_inicio,
    fecha_fin,
    hora_inicio,
    hora_fin,
    importante: normalizeBoolean(data.importante),
    notificar: normalizeBoolean(data.notificar)
  };
};

const getClassroomLabel = (event) => {
  return `${event.grado || ''} ${event.seccion || ''} ${event.turno || ''}`.trim();
};

const teacherCanUseClassroom = async ({
  client,
  userId,
  aulaId
}) => {
  const result = await client.query(
    `
    SELECT 1
    FROM docentes d
    INNER JOIN docente_curso dc
      ON dc.docente_id = d.id
    WHERE d.user_id = $1
      AND dc.aula_id = $2
    LIMIT 1
    `,
    [
      userId,
      aulaId
    ]
  );

  return result.rows.length > 0;
};

const classroomExists = async ({
  client,
  aulaId
}) => {
  if (!aulaId) return true;

  const result = await client.query(
    `
    SELECT id
    FROM aulas
    WHERE id = $1
    LIMIT 1
    `,
    [aulaId]
  );

  return result.rows.length > 0;
};

const getCalendarEventByIdWithClient = async ({
  client,
  id
}) => {
  const result = await client.query(
    `
    SELECT
      ca.id,
      ca.titulo,
      ca.descripcion,
      ca.tipo_evento,
      ca.alcance,
      ca.aula_id,
      ca.fecha_inicio,
      ca.fecha_fin,
      ca.hora_inicio,
      ca.hora_fin,
      ca.importante,
      ca.notificar,
      ca.estado,
      ca.creado_por,
      ca.actualizado_por,
      ca.cancelado_por,
      ca.fecha_cancelacion,
      ca.motivo_cancelacion,
      ca.created_at,
      ca.updated_at,

      uc.nombres || ' ' || uc.apellidos AS creado_por_nombre,
      ua.nombres || ' ' || ua.apellidos AS actualizado_por_nombre,
      ucan.nombres || ' ' || ucan.apellidos AS cancelado_por_nombre,

      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM calendario_academico ca
    LEFT JOIN users uc
      ON ca.creado_por = uc.id
    LEFT JOIN users ua
      ON ca.actualizado_por = ua.id
    LEFT JOIN users ucan
      ON ca.cancelado_por = ucan.id
    LEFT JOIN aulas a
      ON ca.aula_id = a.id
    LEFT JOIN grados g
      ON a.grado_id = g.id
    LEFT JOIN secciones s
      ON a.seccion_id = s.id
    WHERE ca.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
};

const getCalendarNotificationRecipients = async ({
  client,
  event
}) => {
  if (event.alcance === 'general') {
    const result = await client.query(
      `
      SELECT DISTINCT
        u.id AS user_id
      FROM users u
      WHERE u.id IS NOT NULL
        AND COALESCE(u.estado, 'activo') = 'activo'
      `
    );

    return result.rows;
  }

  const result = await client.query(
    `
    SELECT DISTINCT user_id
    FROM (
      SELECT
        u.id AS user_id
      FROM users u
      INNER JOIN roles r
        ON u.rol_id = r.id
      WHERE r.nombre IN ('Director', 'Administrativo', 'Auxiliar')
        AND COALESCE(u.estado, 'activo') = 'activo'

      UNION

      SELECT
        ud.id AS user_id
      FROM docentes d
      INNER JOIN users ud
        ON d.user_id = ud.id
      INNER JOIN docente_curso dc
        ON dc.docente_id = d.id
      WHERE dc.aula_id = $1
        AND ud.id IS NOT NULL
        AND COALESCE(ud.estado, 'activo') = 'activo'

      UNION

      SELECT
        e.user_id AS user_id
      FROM matriculas m
      INNER JOIN estudiantes e
        ON m.estudiante_id = e.id
      INNER JOIN users ue
        ON e.user_id = ue.id
      WHERE m.aula_id = $1
        AND m.estado = 'aprobado'
        AND e.user_id IS NOT NULL
        AND COALESCE(ue.estado, 'activo') = 'activo'

      UNION

      SELECT
        ap.user_id AS user_id
      FROM matriculas m
      INNER JOIN estudiante_apoderado ea
        ON ea.estudiante_id = m.estudiante_id
      INNER JOIN apoderados ap
        ON ea.apoderado_id = ap.id
      INNER JOIN users uap
        ON ap.user_id = uap.id
      WHERE m.aula_id = $1
        AND m.estado = 'aprobado'
        AND ap.user_id IS NOT NULL
        AND COALESCE(uap.estado, 'activo') = 'activo'
    ) recipients
    WHERE user_id IS NOT NULL
    `,
    [event.aula_id]
  );

  return result.rows;
};

const createCalendarNotifications = async ({
  client,
  event
}) => {
  if (!event.notificar) {
    return 0;
  }

  const recipients = await getCalendarNotificationRecipients({
    client,
    event
  });

  const fechaTexto = formatDateForNotification(event.fecha_inicio);
  const aulaTexto = event.alcance === 'aula'
    ? ` para el aula ${getClassroomLabel(event)}`
    : '';

  const mensaje = `Se registró un evento importante: ${event.titulo}${aulaTexto} para el ${fechaTexto}.`;

  let total = 0;

  for (const recipient of recipients) {
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
      VALUES ($1, 'evento_calendario', $2, 'no_leida', NOW(), NOW())
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

export const getCalendarEvents = async ({
  userId,
  rol,
  estado = 'activo',
  desde,
  hasta,
  tipo_evento
}) => {
  const values = [];

  let query = `
    SELECT
      ca.id,
      ca.titulo,
      ca.descripcion,
      ca.tipo_evento,
      ca.alcance,
      ca.aula_id,
      ca.fecha_inicio,
      ca.fecha_fin,
      ca.hora_inicio,
      ca.hora_fin,
      ca.importante,
      ca.notificar,
      ca.estado,
      ca.creado_por,
      ca.actualizado_por,
      ca.cancelado_por,
      ca.fecha_cancelacion,
      ca.motivo_cancelacion,
      ca.created_at,
      ca.updated_at,

      uc.nombres || ' ' || uc.apellidos AS creado_por_nombre,
      ua.nombres || ' ' || ua.apellidos AS actualizado_por_nombre,
      ucan.nombres || ' ' || ucan.apellidos AS cancelado_por_nombre,

      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM calendario_academico ca
    LEFT JOIN users uc
      ON ca.creado_por = uc.id
    LEFT JOIN users ua
      ON ca.actualizado_por = ua.id
    LEFT JOIN users ucan
      ON ca.cancelado_por = ucan.id
    LEFT JOIN aulas a
      ON ca.aula_id = a.id
    LEFT JOIN grados g
      ON a.grado_id = g.id
    LEFT JOIN secciones s
      ON a.seccion_id = s.id
    WHERE 1 = 1
  `;

  if (estado && estado !== 'todos') {
    if (!EVENT_STATES.includes(estado)) {
      throw new Error('Estado de evento no válido');
    }

    values.push(estado);

    query += `
      AND ca.estado = $${values.length}
    `;
  }

  if (desde) {
    values.push(getDateOnly(desde));

    query += `
      AND COALESCE(ca.fecha_fin, ca.fecha_inicio) >= $${values.length}
    `;
  }

  if (hasta) {
    values.push(getDateOnly(hasta));

    query += `
      AND ca.fecha_inicio <= $${values.length}
    `;
  }

  if (tipo_evento && tipo_evento !== 'todos') {
    if (!EVENT_TYPES.includes(tipo_evento)) {
      throw new Error('Tipo de evento no válido');
    }

    values.push(tipo_evento);

    query += `
      AND ca.tipo_evento = $${values.length}
    `;
  }

  if (rol === 'Docente') {
    values.push(userId);

    query += `
      AND (
        ca.alcance = 'general'
        OR EXISTS (
          SELECT 1
          FROM docentes d
          INNER JOIN docente_curso dc
            ON dc.docente_id = d.id
          WHERE d.user_id = $${values.length}
            AND dc.aula_id = ca.aula_id
        )
      )
    `;
  }

  if (rol === 'Estudiante') {
    values.push(userId);

    query += `
      AND (
        ca.alcance = 'general'
        OR EXISTS (
          SELECT 1
          FROM estudiantes e
          INNER JOIN matriculas m
            ON m.estudiante_id = e.id
          WHERE e.user_id = $${values.length}
            AND m.estado = 'aprobado'
            AND m.aula_id = ca.aula_id
        )
      )
    `;
  }

  if (rol === 'Apoderado') {
    values.push(userId);

    query += `
      AND (
        ca.alcance = 'general'
        OR EXISTS (
          SELECT 1
          FROM apoderados ap
          INNER JOIN estudiante_apoderado ea
            ON ea.apoderado_id = ap.id
          INNER JOIN matriculas m
            ON m.estudiante_id = ea.estudiante_id
          WHERE ap.user_id = $${values.length}
            AND m.estado = 'aprobado'
            AND m.aula_id = ca.aula_id
        )
      )
    `;
  }

  query += `
    ORDER BY
      ca.fecha_inicio ASC,
      ca.hora_inicio ASC NULLS LAST,
      ca.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getCalendarClassrooms = async ({
  userId,
  rol
}) => {
  let query = `
    SELECT DISTINCT
      a.id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM aulas a
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
  `;

  const values = [];

  if (rol === 'Docente') {
    values.push(userId);

    query += `
      INNER JOIN docente_curso dc
        ON dc.aula_id = a.id
      INNER JOIN docentes d
        ON dc.docente_id = d.id
    `;
  }

  if (rol === 'Estudiante') {
    values.push(userId);

    query += `
      INNER JOIN matriculas m
        ON m.aula_id = a.id
       AND m.estado = 'aprobado'
      INNER JOIN estudiantes e
        ON m.estudiante_id = e.id
    `;
  }

  if (rol === 'Apoderado') {
    values.push(userId);

    query += `
      INNER JOIN matriculas m
        ON m.aula_id = a.id
       AND m.estado = 'aprobado'
      INNER JOIN estudiante_apoderado ea
        ON ea.estudiante_id = m.estudiante_id
      INNER JOIN apoderados ap
        ON ea.apoderado_id = ap.id
    `;
  }

  query += `
    WHERE COALESCE(a.estado, 'activo') = 'activo'
  `;

  if (rol === 'Docente') {
    query += `
      AND d.user_id = $1
    `;
  }

  if (rol === 'Estudiante') {
    query += `
      AND e.user_id = $1
    `;
  }

  if (rol === 'Apoderado') {
    query += `
      AND ap.user_id = $1
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

export const createCalendarEvent = async ({
  data,
  userId,
  rol
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const payload = normalizeEventPayload(data);

    if (rol === 'Docente' && payload.alcance !== 'aula') {
      throw new Error('El docente solo puede crear eventos por aula');
    }

    if (payload.aula_id) {
      const exists = await classroomExists({
        client,
        aulaId: payload.aula_id
      });

      if (!exists) {
        throw new Error('El aula seleccionada no existe');
      }
    }

    if (rol === 'Docente') {
      const canUseClassroom = await teacherCanUseClassroom({
        client,
        userId,
        aulaId: payload.aula_id
      });

      if (!canUseClassroom) {
        throw new Error('Solo puedes crear eventos para tus aulas asignadas');
      }
    }

    const insertResult = await client.query(
      `
      INSERT INTO calendario_academico (
        titulo,
        descripcion,
        tipo_evento,
        alcance,
        aula_id,
        fecha_inicio,
        fecha_fin,
        hora_inicio,
        hora_fin,
        importante,
        notificar,
        estado,
        creado_por,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'activo',$12,NOW(),NOW()
      )
      RETURNING id
      `,
      [
        payload.titulo,
        payload.descripcion,
        payload.tipo_evento,
        payload.alcance,
        payload.aula_id,
        payload.fecha_inicio,
        payload.fecha_fin,
        payload.hora_inicio,
        payload.hora_fin,
        payload.importante,
        payload.notificar,
        userId
      ]
    );

    const event = await getCalendarEventByIdWithClient({
      client,
      id: insertResult.rows[0].id
    });

    const notificationsCreated = await createCalendarNotifications({
      client,
      event
    });

    await client.query('COMMIT');

    return {
      event,
      notificaciones_generadas: notificationsCreated
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const updateCalendarEvent = async ({
  id,
  data,
  userId,
  rol
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const current = await getCalendarEventByIdWithClient({
      client,
      id
    });

    if (!current) {
      throw new Error('El evento no existe');
    }

    if (current.estado === 'cancelado') {
      throw new Error('No se puede editar un evento cancelado');
    }

    const payload = normalizeEventPayload({
      ...current,
      ...data
    });

    if (payload.aula_id) {
      const exists = await classroomExists({
        client,
        aulaId: payload.aula_id
      });

      if (!exists) {
        throw new Error('El aula seleccionada no existe');
      }
    }

    if (rol === 'Docente') {
      if (String(current.creado_por) !== String(userId)) {
        throw new Error('Solo puedes editar eventos creados por ti');
      }

      if (payload.alcance !== 'aula') {
        throw new Error('El docente solo puede editar eventos por aula');
      }

      const canUseClassroom = await teacherCanUseClassroom({
        client,
        userId,
        aulaId: payload.aula_id
      });

      if (!canUseClassroom) {
        throw new Error('Solo puedes editar eventos de tus aulas asignadas');
      }
    }

    const updateResult = await client.query(
      `
      UPDATE calendario_academico
      SET
        titulo = $2,
        descripcion = $3,
        tipo_evento = $4,
        alcance = $5,
        aula_id = $6,
        fecha_inicio = $7,
        fecha_fin = $8,
        hora_inicio = $9,
        hora_fin = $10,
        importante = $11,
        notificar = $12,
        actualizado_por = $13,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
      `,
      [
        id,
        payload.titulo,
        payload.descripcion,
        payload.tipo_evento,
        payload.alcance,
        payload.aula_id,
        payload.fecha_inicio,
        payload.fecha_fin,
        payload.hora_inicio,
        payload.hora_fin,
        payload.importante,
        payload.notificar,
        userId
      ]
    );

    const event = await getCalendarEventByIdWithClient({
      client,
      id: updateResult.rows[0].id
    });

    await client.query('COMMIT');

    return event;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const cancelCalendarEvent = async ({
  id,
  userId,
  rol,
  motivo
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const current = await getCalendarEventByIdWithClient({
      client,
      id
    });

    if (!current) {
      throw new Error('El evento no existe');
    }

    if (current.estado === 'cancelado') {
      throw new Error('El evento ya está cancelado');
    }

    if (rol === 'Docente') {
      if (String(current.creado_por) !== String(userId)) {
        throw new Error('Solo puedes cancelar eventos creados por ti');
      }

      if (current.alcance !== 'aula') {
        throw new Error('El docente solo puede cancelar eventos por aula');
      }

      const canUseClassroom = await teacherCanUseClassroom({
        client,
        userId,
        aulaId: current.aula_id
      });

      if (!canUseClassroom) {
        throw new Error('Solo puedes cancelar eventos de tus aulas asignadas');
      }
    }

    const result = await client.query(
      `
      UPDATE calendario_academico
      SET
        estado = 'cancelado',
        cancelado_por = $2,
        fecha_cancelacion = NOW(),
        motivo_cancelacion = $3,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
      `,
      [
        id,
        userId,
        motivo || 'Evento cancelado desde el calendario académico.'
      ]
    );

    const event = await getCalendarEventByIdWithClient({
      client,
      id: result.rows[0].id
    });

    await client.query('COMMIT');

    return event;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};