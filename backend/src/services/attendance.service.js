import pool from '../config/db.js';
import supabase from '../config/supabase.js';
import crypto from 'crypto';

export const getStudentsByClassroom = async (aulaId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      m.aula_id,
      m.periodo_id
    FROM matriculas m
    INNER JOIN estudiantes e
      ON m.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    WHERE m.aula_id = $1
      AND m.estado = 'aprobado'
      AND e.estado = 'activo'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [aulaId]);
  return result.rows;
};

export const saveClassroomAttendance = async ({ aula_id, fecha, asistencias }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const allowedStates = ['presente', 'tarde', 'falta', 'justificado'];

    for (const item of asistencias) {
      const { estudiante_id, estado, observacion } = item;

      if (!allowedStates.includes(estado)) {
        throw new Error(`Estado no válido para estudiante ${estudiante_id}`);
      }

      if (estado === 'justificado' && !observacion) {
        throw new Error(`Debe registrar observación para la justificación del estudiante ${estudiante_id}`);
      }

      const enrollmentCheck = await client.query(
        `
        SELECT id
        FROM matriculas
        WHERE estudiante_id = $1
          AND aula_id = $2
          AND estado = 'aprobado'
        LIMIT 1
        `,
        [estudiante_id, aula_id]
      );

      if (enrollmentCheck.rows.length === 0) {
        throw new Error(`El estudiante ${estudiante_id} no pertenece al aula indicada`);
      }

      await client.query(
        `
        INSERT INTO asistencias (
          estudiante_id,
          aula_id,
          horario_id,
          fecha,
          estado,
          observacion,
          created_at
        )
        VALUES ($1,$2,NULL,$3,$4,$5,NOW())
        ON CONFLICT (estudiante_id, fecha, aula_id)
        DO UPDATE SET
          estado = EXCLUDED.estado,
          observacion = EXCLUDED.observacion
        `,
        [
          estudiante_id,
          aula_id,
          fecha,
          estado,
          observacion || null
        ]
      );
    }

    const generatedAlerts = await generateConsecutiveAbsenceAlerts({
      client,
      aulaId: aula_id,
      fecha,
      asistencias
    });

    await client.query('COMMIT');

    return {
      aula_id,
      fecha,
      total_registros: asistencias.length,
      alertas_generadas: generatedAlerts.length,
      alertas: generatedAlerts
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getAttendanceByClassroomAndDate = async (aulaId, fecha) => {
  const query = `
    SELECT
      a.id,
      a.fecha,
      a.estado,
      a.observacion,
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno
    FROM asistencias a
    INNER JOIN estudiantes e
      ON a.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    INNER JOIN aulas au
      ON a.aula_id = au.id
    INNER JOIN grados g
      ON au.grado_id = g.id
    INNER JOIN secciones s
      ON au.seccion_id = s.id
    WHERE a.aula_id = $1
      AND a.fecha = $2
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [aulaId, fecha]);
  return result.rows;
};

export const getAttendanceByClassroomRange = async ({
  aulaId,
  fechaInicio,
  fechaFin
}) => {
  const recordsQuery = `
    SELECT
      a.id,
      a.fecha,
      a.estado,
      a.observacion,
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno
    FROM asistencias a
    INNER JOIN estudiantes e
      ON a.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    INNER JOIN aulas au
      ON a.aula_id = au.id
    INNER JOIN grados g
      ON au.grado_id = g.id
    INNER JOIN secciones s
      ON au.seccion_id = s.id
    WHERE a.aula_id = $1
      AND a.fecha BETWEEN $2 AND $3
    ORDER BY a.fecha DESC, u.apellidos ASC, u.nombres ASC
  `;

  const summaryQuery = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      COUNT(a.id)::int AS total,
      (COUNT(a.id) FILTER (WHERE a.estado = 'presente'))::int AS presente,
      (COUNT(a.id) FILTER (WHERE a.estado = 'tarde'))::int AS tarde,
      (COUNT(a.id) FILTER (WHERE a.estado = 'falta'))::int AS falta,
      (COUNT(a.id) FILTER (WHERE a.estado = 'justificado'))::int AS justificado
    FROM matriculas m
    INNER JOIN estudiantes e
      ON m.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    LEFT JOIN asistencias a
      ON a.estudiante_id = e.id
      AND a.aula_id = m.aula_id
      AND a.fecha BETWEEN $2 AND $3
    WHERE m.aula_id = $1
      AND m.estado = 'aprobado'
      AND e.estado = 'activo'
    GROUP BY
      e.id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const [recordsResult, summaryResult] = await Promise.all([
    pool.query(recordsQuery, [aulaId, fechaInicio, fechaFin]),
    pool.query(summaryQuery, [aulaId, fechaInicio, fechaFin])
  ]);

  return {
    records: recordsResult.rows,
    summary: summaryResult.rows
  };
};

export const getAttendanceByStudent = async (studentId) => {
  const query = `
    SELECT
      a.id,
      a.fecha,
      a.estado,
      a.observacion,
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno
    FROM asistencias a
    INNER JOIN aulas au
      ON a.aula_id = au.id
    INNER JOIN grados g
      ON au.grado_id = g.id
    INNER JOIN secciones s
      ON au.seccion_id = s.id
    WHERE a.estudiante_id = $1
    ORDER BY a.fecha DESC
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getAttendanceSummaryByClassroom = async (
  aulaId,
  fechaInicio,
  fechaFin
) => {
  let query = `
    SELECT
      estado,
      COUNT(*)::int AS total
    FROM asistencias
    WHERE aula_id = $1
  `;

  const values = [aulaId];

  if (fechaInicio && fechaFin) {
    query += `
      AND fecha BETWEEN $2 AND $3
    `;
    values.push(fechaInicio, fechaFin);
  } else if (fechaInicio) {
    query += `
      AND fecha = $2
    `;
    values.push(fechaInicio);
  }

  query += `
    GROUP BY estado
    ORDER BY estado ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getActiveClassroomsForAttendance = async () => {
  const query = `
    SELECT
      au.id,
      au.grado_id,
      g.nombre AS grado,
      au.seccion_id,
      s.nombre AS seccion,
      au.turno,
      au.capacidad,
      au.estado,
      COUNT(m.id)::int AS matriculados
    FROM aulas au
    INNER JOIN grados g ON au.grado_id = g.id
    INNER JOIN secciones s ON au.seccion_id = s.id
    LEFT JOIN matriculas m
      ON m.aula_id = au.id
      AND m.estado = 'aprobado'
    WHERE au.estado = 'activo'
    GROUP BY
      au.id,
      au.grado_id,
      g.nombre,
      au.seccion_id,
      s.nombre,
      au.turno,
      au.capacidad,
      au.estado
    ORDER BY au.grado_id ASC, s.nombre ASC, au.turno ASC
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getAttendanceForUser = async ({
  userId,
  rol,
  fechaInicio,
  fechaFin
}) => {

    const buildDateFilter = (values) => {
    if (fechaInicio && fechaFin) {
      values.push(fechaInicio, fechaFin);
      return `AND a.fecha BETWEEN $${values.length - 1} AND $${values.length}`;
    }

    if (fechaInicio) {
      values.push(fechaInicio);
      return `AND a.fecha >= $${values.length}`;
    }

    if (fechaFin) {
      values.push(fechaFin);
      return `AND a.fecha <= $${values.length}`;
    }

    return '';
  };

  if (rol === 'Estudiante') {
    const values = [userId];
    const dateFilter = buildDateFilter(values);
    const query = `
      SELECT
        e.id AS estudiante_id,
        ue.nombres || ' ' || ue.apellidos AS estudiante,
        a.id,
        a.fecha,
        a.estado,
        a.observacion,
        au.id AS aula_id,
        g.nombre AS grado,
        s.nombre AS seccion,
        au.turno
      FROM estudiantes e
      INNER JOIN users ue ON e.user_id = ue.id
      LEFT JOIN asistencias a ON a.estudiante_id = e.id
      LEFT JOIN aulas au ON a.aula_id = au.id
      LEFT JOIN grados g ON au.grado_id = g.id
      LEFT JOIN secciones s ON au.seccion_id = s.id
      WHERE e.user_id = $1
      ${dateFilter}
      ORDER BY a.fecha DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  if (rol === 'Apoderado') {
    const values = [userId];
    const dateFilter = buildDateFilter(values);
    const query = `
      SELECT
        e.id AS estudiante_id,
        ue.nombres || ' ' || ue.apellidos AS estudiante,
        ea.parentesco,
        a.id,
        a.fecha,
        a.estado,
        a.observacion,
        au.id AS aula_id,
        g.nombre AS grado,
        s.nombre AS seccion,
        au.turno
      FROM apoderados ap
      INNER JOIN estudiante_apoderado ea ON ea.apoderado_id = ap.id
      INNER JOIN estudiantes e ON ea.estudiante_id = e.id
      INNER JOIN users ue ON e.user_id = ue.id
      LEFT JOIN asistencias a ON a.estudiante_id = e.id
      LEFT JOIN aulas au ON a.aula_id = au.id
      LEFT JOIN grados g ON au.grado_id = g.id
      LEFT JOIN secciones s ON au.seccion_id = s.id
      WHERE ap.user_id = $1
      ${dateFilter}
      ORDER BY ue.apellidos ASC, ue.nombres ASC, a.fecha DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  if (rol === 'Docente') {
    const values = [userId];
    const dateFilter = buildDateFilter(values);
    const query = `
      SELECT
        a.id,
        a.fecha,
        a.estado,
        a.observacion,
        e.id AS estudiante_id,
        ue.nombres || ' ' || ue.apellidos AS estudiante,
        ue.dni,
        au.id AS aula_id,
        g.nombre AS grado,
        s.nombre AS seccion,
        au.turno,
        c.id AS curso_id,
        c.nombre AS curso
      FROM docentes d
      INNER JOIN docente_curso dc ON dc.docente_id = d.id
      INNER JOIN cursos c ON dc.curso_id = c.id
      INNER JOIN aulas au ON dc.aula_id = au.id
      INNER JOIN grados g ON au.grado_id = g.id
      INNER JOIN secciones s ON au.seccion_id = s.id
      INNER JOIN matriculas m
        ON m.aula_id = au.id
        AND m.estado = 'aprobado'
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      INNER JOIN users ue ON e.user_id = ue.id
      LEFT JOIN asistencias a
        ON a.estudiante_id = e.id
        AND a.aula_id = au.id
      WHERE d.user_id = $1
      ${dateFilter}
      ORDER BY a.fecha DESC, ue.apellidos ASC, ue.nombres ASC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  return [];
};

const getPeruDateTimeParts = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const map = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour),
    minute: Number(map.minute)
  };
};

const getDateOnly = (value) => {
  if (!value) return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  const isoDateMatch = text.match(/^\d{4}-\d{2}-\d{2}/);

  if (isoDateMatch) {
    return isoDateMatch[0];
  }

  const parsedDate = new Date(text);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
};

const formatDateForAlertMessage = (value) => {
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

  const monthLabel = months[Number(month) - 1] || month;

  return `${day} ${monthLabel} ${year}`;
};

const getStudentClassroomInfo = async ({
  client,
  estudianteId,
  aulaId
}) => {
  const result = await client.query(
    `
    SELECT
      e.id AS estudiante_id,
      ue.nombres || ' ' || ue.apellidos AS estudiante,
      ue.dni AS estudiante_dni,
      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno
    FROM estudiantes e
    INNER JOIN users ue
      ON e.user_id = ue.id
    INNER JOIN aulas au
      ON au.id = $2
    INNER JOIN grados g
      ON au.grado_id = g.id
    INNER JOIN secciones s
      ON au.seccion_id = s.id
    WHERE e.id = $1
    LIMIT 1
    `,
    [
      estudianteId,
      aulaId
    ]
  );

  return result.rows[0] || null;
};

const getGuardianUsersForStudent = async ({
  client,
  estudianteId
}) => {
  const result = await client.query(
    `
    SELECT DISTINCT
      u.id AS user_id,
      u.nombres,
      u.apellidos,
      u.telefono
    FROM estudiante_apoderado ea
    INNER JOIN apoderados ap
      ON ea.apoderado_id = ap.id
    INNER JOIN users u
      ON ap.user_id = u.id
    WHERE ea.estudiante_id = $1
      AND u.id IS NOT NULL
      AND COALESCE(u.estado, 'activo') = 'activo'
    `,
    [estudianteId]
  );

  return result.rows;
};

const createGuardianNotificationsForAlert = async ({
  client,
  estudianteId,
  mensaje
}) => {
  const guardians = await getGuardianUsersForStudent({
    client,
    estudianteId
  });

  for (const guardian of guardians) {
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
      VALUES ($1, 'alerta_asistencia', $2, 'no_leida', NOW(), NOW())
      `,
      [
        guardian.user_id,
        mensaje
      ]
    );
  }

  return guardians.length;
};

const getLastThreeRegisteredAttendance = async ({
  client,
  estudianteId,
  aulaId
}) => {
  const result = await client.query(
    `
    SELECT
      id,
      fecha,
      estado
    FROM asistencias
    WHERE estudiante_id = $1
      AND aula_id = $2
      AND EXTRACT(ISODOW FROM fecha::date) BETWEEN 1 AND 5
    ORDER BY fecha DESC
    LIMIT 3
    `,
    [
      estudianteId,
      aulaId
    ]
  );

  return result.rows;
};

const createConsecutiveAbsenceAlertIfNeeded = async ({
  client,
  estudianteId,
  aulaId,
  fecha
}) => {
  const lastRecords = await getLastThreeRegisteredAttendance({
    client,
    estudianteId,
    aulaId
  });

  if (lastRecords.length < 3) {
    return null;
  }

  const savedDate = getDateOnly(fecha);

  const savedDateIsInLastRecords = lastRecords.some(
    (item) => getDateOnly(item.fecha) === savedDate
  );

  if (!savedDateIsInLastRecords) {
    return null;
  }

  const hasThreeConsecutiveAbsences = lastRecords.every(
    (item) => item.estado === 'falta'
  );

  if (!hasThreeConsecutiveAbsences) {
    return null;
  }

  const recordsAsc = [...lastRecords].reverse();

  const fechaInicio = getDateOnly(recordsAsc[0].fecha);
  const fechaFin = getDateOnly(recordsAsc[recordsAsc.length - 1].fecha);
  const fechaInicioTexto = formatDateForAlertMessage(fechaInicio);
  const fechaFinTexto = formatDateForAlertMessage(fechaFin);

  const info = await getStudentClassroomInfo({
    client,
    estudianteId,
    aulaId
  });

  if (!info) {
    return null;
  }

  const classroomName = `${info.grado || ''} ${info.seccion || ''} ${info.turno || ''}`.trim();

  const mensaje = `${info.estudiante} registra 3 faltas consecutivas en el aula ${classroomName}, entre el ${fechaInicioTexto} y el ${fechaFinTexto}. Se recomienda realizar seguimiento inmediato.`;

  const insertResult = await client.query(
    `
    INSERT INTO alertas_asistencia (
      estudiante_id,
      aula_id,
      tipo,
      cantidad_faltas,
      fecha_inicio,
      fecha_fin,
      mensaje,
      estado,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      'inasistencias_consecutivas',
      3,
      $3,
      $4,
      $5,
      'activa',
      NOW(),
      NOW()
    )
    ON CONFLICT (estudiante_id, aula_id, tipo)
    WHERE estado = 'activa'
    DO NOTHING
    RETURNING *
    `,
    [
      estudianteId,
      aulaId,
      fechaInicio,
      fechaFin,
      mensaje
    ]
  );

  if (insertResult.rows.length === 0) {
    return null;
  }

  const alert = insertResult.rows[0];

  const notifiedGuardians = await createGuardianNotificationsForAlert({
    client,
    estudianteId,
    mensaje
  });

  return {
    ...alert,
    estudiante: info.estudiante,
    grado: info.grado,
    seccion: info.seccion,
    turno: info.turno,
    apoderados_notificados: notifiedGuardians
  };
};

const generateConsecutiveAbsenceAlerts = async ({
  client,
  aulaId,
  fecha,
  asistencias
}) => {
  const absentStudentIds = [
    ...new Set(
      asistencias
        .filter((item) => item.estado === 'falta')
        .map((item) => Number(item.estudiante_id))
        .filter(Boolean)
    )
  ];

  const generatedAlerts = [];

  for (const estudianteId of absentStudentIds) {
    const alert = await createConsecutiveAbsenceAlertIfNeeded({
      client,
      estudianteId,
      aulaId,
      fecha
    });

    if (alert) {
      generatedAlerts.push(alert);
    }
  }

  return generatedAlerts;
};

const resolveActiveAttendanceAlertsForStudent = async ({
  client,
  estudianteId,
  aulaId,
  resolvedBy,
  observacion
}) => {
  const result = await client.query(
    `
    UPDATE alertas_asistencia
    SET
      estado = 'resuelta',
      resuelta_por = $3,
      fecha_resolucion = NOW(),
      observacion_resolucion = $4,
      updated_at = NOW()
    WHERE estudiante_id = $1
      AND aula_id = $2
      AND tipo = 'inasistencias_consecutivas'
      AND estado = 'activa'
    RETURNING *
    `,
    [
      estudianteId,
      aulaId,
      resolvedBy,
      observacion || 'Alerta resuelta automáticamente por actualización de asistencia.'
    ]
  );

  return result.rows;
};

const isWithinJustificationLimit = (attendanceDate) => {
  const now = getPeruDateTimeParts();
  const dateOnly = getDateOnly(attendanceDate);

  const currentMinutes = now.hour * 60 + now.minute;

  const limitMinutes = Number(
    process.env.JUSTIFICATION_LIMIT_MINUTES || 18 * 60
  );

  if (dateOnly !== now.date) {
    return false;
  }

  return currentMinutes <= limitMinutes;
};

const getFileExtension = (fileName = '') => {
  const parts = String(fileName).split('.');

  if (parts.length <= 1) return 'bin';

  return parts.pop().toLowerCase();
};

const uploadJustificationFile = async ({
  asistenciaId,
  file
}) => {
  if (!file) {
    return {
      archivo_url: null,
      archivo_nombre: null
    };
  }

  const fileExtension = getFileExtension(file.originalname);
  const fileName = `justificacion-${crypto.randomUUID()}.${fileExtension}`;
  const storagePath = `justificaciones-asistencia/${asistenciaId}/${fileName}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    archivo_url: storagePath,
    archivo_nombre: file.originalname
  };
};

const assertGuardianCanAccessStudent = async ({
  userId,
  estudianteId,
  client = pool
}) => {
  const result = await client.query(
    `
    SELECT
      ap.id AS apoderado_id
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea
      ON ea.apoderado_id = ap.id
    WHERE ap.user_id = $1
      AND ea.estudiante_id = $2
    LIMIT 1
    `,
    [
      userId,
      estudianteId
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('No tiene permiso para justificar la asistencia de este estudiante');
  }

  return result.rows[0].apoderado_id;
};

export const createAttendanceJustification = async ({
  asistenciaId,
  motivo,
  file,
  userId,
  rol
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const attendanceResult = await client.query(
      `
      SELECT
        a.id,
        a.estudiante_id,
        a.aula_id,
        a.fecha,
        a.estado,
        a.observacion,
        ue.nombres || ' ' || ue.apellidos AS estudiante
      FROM asistencias a
      INNER JOIN estudiantes e
        ON a.estudiante_id = e.id
      INNER JOIN users ue
        ON e.user_id = ue.id
      WHERE a.id = $1
      LIMIT 1
      `,
      [asistenciaId]
    );

    if (attendanceResult.rows.length === 0) {
      throw new Error('La asistencia indicada no existe');
    }

    const attendance = attendanceResult.rows[0];

    if (attendance.estado !== 'falta') {
      throw new Error('Solo se puede justificar una asistencia registrada como falta');
    }

    if (!isWithinJustificationLimit(attendance.fecha)) {
      throw new Error('La justificación solo puede enviarse el mismo día hasta las 6:00 p. m.');
    }

    const existingResult = await client.query(
      `
      SELECT id
      FROM justificaciones_asistencia
      WHERE asistencia_id = $1
      LIMIT 1
      `,
      [asistenciaId]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Esta asistencia ya tiene una justificación registrada');
    }

    let apoderadoId = null;

    if (rol === 'Apoderado') {
      apoderadoId = await assertGuardianCanAccessStudent({
        userId,
        estudianteId: attendance.estudiante_id,
        client
      });
    }

    if (rol !== 'Apoderado' && rol !== 'Auxiliar') {
      throw new Error('No tiene permiso para registrar justificaciones');
    }

    const uploadedFile = await uploadJustificationFile({
      asistenciaId,
      file
    });

    const insertResult = await client.query(
      `
      INSERT INTO justificaciones_asistencia (
        asistencia_id,
        estudiante_id,
        apoderado_id,
        registrado_por,
        motivo,
        archivo_url,
        archivo_nombre,
        estado,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente',NOW(),NOW())
      RETURNING *
      `,
      [
        asistenciaId,
        attendance.estudiante_id,
        apoderadoId,
        userId,
        motivo,
        uploadedFile.archivo_url,
        uploadedFile.archivo_nombre
      ]
    );

    await client.query('COMMIT');

    return insertResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getAttendanceJustifications = async ({
  userId,
  rol
}) => {
  const baseSelect = `
    SELECT
      ja.id,
      ja.asistencia_id,
      ja.estudiante_id,
      ja.apoderado_id,
      ja.registrado_por,
      ja.revisado_por,
      ja.motivo,
      ja.archivo_url,
      ja.archivo_nombre,
      ja.estado,
      ja.respuesta,
      ja.fecha_revision,
      ja.created_at,
      ja.updated_at,

      a.fecha AS fecha_asistencia,
      a.estado AS estado_asistencia,
      a.observacion AS observacion_asistencia,

      e.codigo_estudiante,
      ue.nombres || ' ' || ue.apellidos AS estudiante,
      ue.dni AS estudiante_dni,

      au.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno,

      ur.nombres || ' ' || ur.apellidos AS registrado_por_nombre,
      uv.nombres || ' ' || uv.apellidos AS revisado_por_nombre,

      ea.parentesco
    FROM justificaciones_asistencia ja
    INNER JOIN asistencias a
      ON ja.asistencia_id = a.id
    INNER JOIN estudiantes e
      ON ja.estudiante_id = e.id
    INNER JOIN users ue
      ON e.user_id = ue.id
    LEFT JOIN aulas au
      ON a.aula_id = au.id
    LEFT JOIN grados g
      ON au.grado_id = g.id
    LEFT JOIN secciones s
      ON au.seccion_id = s.id
    LEFT JOIN users ur
      ON ja.registrado_por = ur.id
    LEFT JOIN users uv
      ON ja.revisado_por = uv.id
    LEFT JOIN estudiante_apoderado ea
      ON ea.estudiante_id = e.id
      AND ea.apoderado_id = ja.apoderado_id
  `;

  if (rol === 'Apoderado') {
    const query = `
      ${baseSelect}
      INNER JOIN apoderados ap
        ON ap.id = ea.apoderado_id
      WHERE ap.user_id = $1
      ORDER BY ja.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  if (['Auxiliar', 'Director', 'Administrativo'].includes(rol)) {
    const query = `
      ${baseSelect}
      ORDER BY ja.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  return [];
};

export const reviewAttendanceJustification = async ({
  id,
  estado,
  respuesta,
  reviewedBy
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const justificationResult = await client.query(
      `
      SELECT
        ja.*,
        a.aula_id
      FROM justificaciones_asistencia ja
      INNER JOIN asistencias a
        ON ja.asistencia_id = a.id
      WHERE ja.id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (justificationResult.rows.length === 0) {
      throw new Error('Justificación no encontrada');
    }

    const justification = justificationResult.rows[0];

    if (justification.estado !== 'pendiente') {
      throw new Error('Esta justificación ya fue revisada');
    }

    const updatedResult = await client.query(
      `
      UPDATE justificaciones_asistencia
      SET
        estado = $1,
        respuesta = $2,
        revisado_por = $3,
        fecha_revision = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [
        estado,
        respuesta,
        reviewedBy,
        id
      ]
    );

    if (estado === 'aprobado') {
      await client.query(
        `
        UPDATE asistencias
        SET
          estado = 'justificado',
          observacion = $1
        WHERE id = $2
        `,
        [
          respuesta || justification.motivo,
          justification.asistencia_id
        ]
      );

      await resolveActiveAttendanceAlertsForStudent({
        client,
        estudianteId: justification.estudiante_id,
        aulaId: justification.aula_id,
        resolvedBy: reviewedBy,
        observacion: 'Alerta resuelta automáticamente por aprobación de justificación.'
      });
    }

    if (estado === 'rechazado') {
      await client.query(
        `
        UPDATE asistencias
        SET estado = 'falta'
        WHERE id = $1
        `,
        [justification.asistencia_id]
      );
    }

    await client.query('COMMIT');

    return updatedResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const downloadAttendanceJustificationFile = async ({
  id,
  userId,
  rol
}) => {
  const query = `
    SELECT
      ja.id,
      ja.estudiante_id,
      ja.archivo_url,
      ja.archivo_nombre
    FROM justificaciones_asistencia ja
    WHERE ja.id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new Error('Justificación no encontrada');
  }

  const justification = result.rows[0];

  if (!justification.archivo_url) {
    throw new Error('La justificación no tiene archivo adjunto');
  }

  if (rol === 'Apoderado') {
    await assertGuardianCanAccessStudent({
      userId,
      estudianteId: justification.estudiante_id
    });
  }

  if (!['Apoderado', 'Auxiliar', 'Director', 'Administrativo'].includes(rol)) {
    throw new Error('No tiene permiso para descargar este archivo');
  }

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .download(justification.archivo_url);

  if (error) {
    throw new Error(error.message);
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    fileName: justification.archivo_nombre || `justificacion-${justification.id}`,
    contentType: data.type || 'application/octet-stream'
  };
};

export const getAttendanceAlerts = async ({
  estado
} = {}) => {
  const values = [];

  let query = `
    SELECT
      aa.id,
      aa.estudiante_id,
      aa.aula_id,
      aa.tipo,
      aa.cantidad_faltas,
      aa.fecha_inicio,
      aa.fecha_fin,
      aa.mensaje,
      aa.estado,
      aa.resuelta_por,
      aa.fecha_resolucion,
      aa.observacion_resolucion,
      aa.created_at,
      aa.updated_at,

      e.codigo_estudiante,
      ue.nombres || ' ' || ue.apellidos AS estudiante,
      ue.dni AS estudiante_dni,

      g.nombre AS grado,
      s.nombre AS seccion,
      au.turno,

      ur.nombres || ' ' || ur.apellidos AS resuelta_por_nombre
    FROM alertas_asistencia aa
    INNER JOIN estudiantes e
      ON aa.estudiante_id = e.id
    INNER JOIN users ue
      ON e.user_id = ue.id
    INNER JOIN aulas au
      ON aa.aula_id = au.id
    INNER JOIN grados g
      ON au.grado_id = g.id
    INNER JOIN secciones s
      ON au.seccion_id = s.id
    LEFT JOIN users ur
      ON aa.resuelta_por = ur.id
    WHERE aa.tipo = 'inasistencias_consecutivas'
  `;

  if (estado && ['activa', 'resuelta'].includes(estado)) {
    values.push(estado);

    query += `
      AND aa.estado = $${values.length}
    `;
  }

  query += `
    ORDER BY
      CASE WHEN aa.estado = 'activa' THEN 0 ELSE 1 END,
      aa.fecha_fin DESC,
      aa.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const resolveAttendanceAlert = async ({
  id,
  resolvedBy,
  observacion
}) => {
  const result = await pool.query(
    `
    UPDATE alertas_asistencia
    SET
      estado = 'resuelta',
      resuelta_por = $2,
      fecha_resolucion = NOW(),
      observacion_resolucion = $3,
      updated_at = NOW()
    WHERE id = $1
      AND estado = 'activa'
    RETURNING *
    `,
    [
      id,
      resolvedBy,
      observacion || 'Alerta marcada como resuelta manualmente.'
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('La alerta no existe o ya fue resuelta');
  }

  return result.rows[0];
};