import pool from '../config/db.js';

export const getStudentsForGrades = async (aulaId, periodoId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni
    FROM matriculas m
    INNER JOIN estudiantes e ON m.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    WHERE m.aula_id = $1
      AND m.periodo_id = $2
      AND m.estado = 'aprobado'
      AND e.estado = 'activo'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [aulaId, periodoId]);
  return result.rows;
};

const formatBimesterLabel = (bimestre) => {
  const labels = {
    B1: 'Bimestre 1',
    B2: 'Bimestre 2',
    B3: 'Bimestre 3',
    B4: 'Bimestre 4'
  };

  return labels[bimestre] || bimestre;
};

const getAcademicAlertContext = async ({
  client,
  estudianteId,
  cursoId,
  aulaId,
  periodoId
}) => {
  const result = await client.query(
    `
    SELECT
      e.id AS estudiante_id,
      e.user_id AS estudiante_user_id,
      ue.nombres || ' ' || ue.apellidos AS estudiante,
      ue.dni AS estudiante_dni,

      c.id AS curso_id,
      c.nombre AS curso,

      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,

      p.id AS periodo_id,
      p.nombre AS periodo
    FROM estudiantes e
    INNER JOIN users ue
      ON e.user_id = ue.id
    INNER JOIN cursos c
      ON c.id = $2
    INNER JOIN aulas a
      ON a.id = $3
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    INNER JOIN periodos_academicos p
      ON p.id = $4
    WHERE e.id = $1
    LIMIT 1
    `,
    [
      estudianteId,
      cursoId,
      aulaId,
      periodoId
    ]
  );

  return result.rows[0] || null;
};

const getGuardianUsersForAcademicAlert = async ({
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

const createAcademicNotifications = async ({
  client,
  estudianteId,
  estudianteUserId,
  mensaje
}) => {
  let total = 0;

  if (estudianteUserId) {
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
      VALUES ($1, 'alerta_academica', $2, 'no_leida', NOW(), NOW())
      `,
      [
        estudianteUserId,
        mensaje
      ]
    );

    total += 1;
  }

  const guardians = await getGuardianUsersForAcademicAlert({
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
      VALUES ($1, 'alerta_academica', $2, 'no_leida', NOW(), NOW())
      `,
      [
        guardian.user_id,
        mensaje
      ]
    );

    total += 1;
  }

  return total;
};

const createAcademicAlertIfNeeded = async ({
  client,
  notaId,
  estudianteId,
  cursoId,
  aulaId,
  periodoId,
  bimestre,
  nota,
  generatedBy
}) => {
  if (nota !== 'C') {
    return null;
  }

  const context = await getAcademicAlertContext({
    client,
    estudianteId,
    cursoId,
    aulaId,
    periodoId
  });

  if (!context) {
    return null;
  }

  const bimesterLabel = formatBimesterLabel(bimestre);

  const classroomName = `${context.grado || ''} ${context.seccion || ''} ${context.turno || ''}`.trim();

  const mensaje = `${context.estudiante} registra bajo rendimiento en ${context.curso} durante el ${bimesterLabel} con calificación C. Se recomienda realizar seguimiento académico.`;

  const insertResult = await client.query(
    `
    INSERT INTO alertas_academicas (
      nota_id,
      estudiante_id,
      curso_id,
      aula_id,
      periodo_id,
      bimestre,
      nota_detectada,
      tipo,
      mensaje,
      estado,
      generada_por,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'C',
      'bajo_rendimiento',
      $7,
      'activa',
      $8,
      NOW(),
      NOW()
    )
    ON CONFLICT (
      estudiante_id,
      curso_id,
      aula_id,
      periodo_id,
      bimestre,
      tipo
    )
    WHERE estado = 'activa'
    DO NOTHING
    RETURNING *
    `,
    [
      notaId,
      estudianteId,
      cursoId,
      aulaId,
      periodoId,
      bimestre,
      mensaje,
      generatedBy
    ]
  );

  if (insertResult.rows.length === 0) {
    return null;
  }

  const alert = insertResult.rows[0];

  const notificationsCreated = await createAcademicNotifications({
    client,
    estudianteId,
    estudianteUserId: context.estudiante_user_id,
    mensaje
  });

  return {
    ...alert,
    estudiante: context.estudiante,
    curso: context.curso,
    grado: context.grado,
    seccion: context.seccion,
    turno: context.turno,
    periodo: context.periodo,
    notificaciones_generadas: notificationsCreated,
    aula: classroomName
  };
};

const resolveActiveAcademicAlertIfNeeded = async ({
  client,
  estudianteId,
  cursoId,
  aulaId,
  periodoId,
  bimestre,
  nota,
  resolvedBy
}) => {
  if (nota === 'C') {
    return null;
  }

  const result = await client.query(
    `
    UPDATE alertas_academicas
    SET
      estado = 'resuelta',
      resuelta_por = $6,
      fecha_resolucion = NOW(),
      observacion_resolucion = $7,
      updated_at = NOW()
    WHERE estudiante_id = $1
      AND curso_id = $2
      AND aula_id = $3
      AND periodo_id = $4
      AND bimestre = $5
      AND tipo = 'bajo_rendimiento'
      AND estado = 'activa'
    RETURNING *
    `,
    [
      estudianteId,
      cursoId,
      aulaId,
      periodoId,
      bimestre,
      resolvedBy,
      `Alerta resuelta automáticamente porque la nota cambió de C a ${nota}.`
    ]
  );

  return result.rows[0] || null;
};

export const saveGrades = async ({
  aula_id,
  curso_id,
  periodo_id,
  bimestre,
  notas,
  userId
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const allowedGrades = ['AD', 'A', 'B', 'C'];
    const allowedBimesters = ['B1', 'B2', 'B3', 'B4'];

    if (!allowedBimesters.includes(bimestre)) {
      throw new Error('Bimestre no válido');
    }

    const periodCheck = await client.query(
      `
      SELECT id
      FROM periodos_academicos
      WHERE id = $1
      LIMIT 1
      `,
      [periodo_id]
    );

    if (periodCheck.rows.length === 0) {
      throw new Error('El período académico no existe');
    }

    const courseCheck = await client.query(
      `
      SELECT id
      FROM cursos
      WHERE id = $1
      LIMIT 1
      `,
      [curso_id]
    );

    if (courseCheck.rows.length === 0) {
      throw new Error('El curso no existe');
    }

    const classroomCheck = await client.query(
      `
      SELECT id
      FROM aulas
      WHERE id = $1
      LIMIT 1
      `,
      [aula_id]
    );

    if (classroomCheck.rows.length === 0) {
      throw new Error('El aula no existe');
    }

    const generatedAcademicAlerts = [];
    const resolvedAcademicAlerts = [];

    for (const item of notas) {
      const { estudiante_id, nota, comentario } = item;

      if (!estudiante_id) {
        throw new Error('Cada registro debe incluir estudiante_id');
      }

      if (!allowedGrades.includes(nota)) {
        throw new Error(`Nota no válida para estudiante ${estudiante_id}`);
      }

      const enrollmentCheck = await client.query(
        `
        SELECT id
        FROM matriculas
        WHERE estudiante_id = $1
          AND aula_id = $2
          AND periodo_id = $3
          AND estado = 'aprobado'
        LIMIT 1
        `,
        [
          estudiante_id,
          aula_id,
          periodo_id
        ]
      );

      if (enrollmentCheck.rows.length === 0) {
        throw new Error(
          `El estudiante ${estudiante_id} no pertenece al aula indicada en el período seleccionado`
        );
      }

      const savedGradeResult = await client.query(
        `
        INSERT INTO notas (
          estudiante_id,
          curso_id,
          aula_id,
          periodo_id,
          bimestre,
          nota,
          comentario,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
        ON CONFLICT (estudiante_id, curso_id, aula_id, bimestre, periodo_id)
        DO UPDATE SET
          nota = EXCLUDED.nota,
          comentario = EXCLUDED.comentario
        RETURNING *
        `,
        [
          estudiante_id,
          curso_id,
          aula_id,
          periodo_id,
          bimestre,
          nota,
          comentario || null
        ]
      );

      const savedGrade = savedGradeResult.rows[0];

      const generatedAlert = await createAcademicAlertIfNeeded({
        client,
        notaId: savedGrade.id,
        estudianteId: estudiante_id,
        cursoId: curso_id,
        aulaId: aula_id,
        periodoId: periodo_id,
        bimestre,
        nota,
        generatedBy: userId
      });

      if (generatedAlert) {
        generatedAcademicAlerts.push(generatedAlert);
      }

      const resolvedAlert = await resolveActiveAcademicAlertIfNeeded({
        client,
        estudianteId: estudiante_id,
        cursoId: curso_id,
        aulaId: aula_id,
        periodoId: periodo_id,
        bimestre,
        nota,
        resolvedBy: userId
      });

      if (resolvedAlert) {
        resolvedAcademicAlerts.push(resolvedAlert);
      }
    }

    await client.query('COMMIT');

    return {
      aula_id,
      curso_id,
      periodo_id,
      bimestre,
      total_registros: notas.length,
      alertas_academicas_generadas: generatedAcademicAlerts.length,
      alertas_academicas_resueltas: resolvedAcademicAlerts.length,
      alertas_generadas: generatedAcademicAlerts,
      alertas_resueltas: resolvedAcademicAlerts
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getGradesByClassroomCourseBimester = async (
  aulaId,
  cursoId,
  bimestre,
  periodoId
) => {
  const query = `
    SELECT
      n.id,
      n.estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      n.curso_id,
      c.nombre AS curso,
      n.aula_id,
      n.periodo_id,
      p.nombre AS periodo,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      n.bimestre,
      n.nota,
      n.comentario,
      n.created_at
    FROM notas n
    INNER JOIN estudiantes e ON n.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN periodos_academicos p ON n.periodo_id = p.id
    WHERE n.aula_id = $1
      AND n.curso_id = $2
      AND n.bimestre = $3
      AND n.periodo_id = $4
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [
    aulaId,
    cursoId,
    bimestre,
    periodoId
  ]);

  return result.rows;
};

export const getGradesByStudent = async (studentId, periodoId = null) => {
  const values = [studentId];

  let periodFilter = '';

  if (periodoId) {
    values.push(periodoId);
    periodFilter = `AND n.periodo_id = $${values.length}`;
  }

  const query = `
    SELECT
      n.id,
      n.periodo_id,
      p.nombre AS periodo,
      n.bimestre,
      n.nota,
      n.comentario,
      c.nombre AS curso,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      n.created_at
    FROM notas n
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN aulas a ON n.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    INNER JOIN periodos_academicos p ON n.periodo_id = p.id
    WHERE n.estudiante_id = $1
      ${periodFilter}
    ORDER BY n.periodo_id ASC, n.bimestre ASC, c.nombre ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getGradesSummaryByClassroomCourse = async (
  aulaId,
  cursoId,
  bimestre,
  periodoId
) => {
  const query = `
    SELECT
      nota,
      COUNT(*)::int AS total
    FROM notas
    WHERE aula_id = $1
      AND curso_id = $2
      AND bimestre = $3
      AND periodo_id = $4
    GROUP BY nota
    ORDER BY nota ASC
  `;

  const result = await pool.query(query, [
    aulaId,
    cursoId,
    bimestre,
    periodoId
  ]);

  return result.rows;
};

export const getStudentsAtRisk = async (aulaId, bimestre, periodoId) => {
  const query = `
    SELECT
      n.estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      c.nombre AS curso,
      n.periodo_id,
      p.nombre AS periodo,
      n.bimestre,
      n.nota,
      n.comentario
    FROM notas n
    INNER JOIN estudiantes e ON n.estudiante_id = e.id
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN cursos c ON n.curso_id = c.id
    INNER JOIN periodos_academicos p ON n.periodo_id = p.id
    WHERE n.aula_id = $1
      AND n.periodo_id = $2
      AND n.bimestre = $3
      AND n.nota = 'C'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [
    aulaId,
    periodoId,
    bimestre
  ]);

  return result.rows;
};

export const teacherCanAccessClassroom = async (teacherUserId, aulaId) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    WHERE d.user_id = $1
      AND dc.aula_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [teacherUserId, aulaId]);
  return result.rows.length > 0;
};

export const teacherCanAccessClassroomCourse = async (
  teacherUserId,
  aulaId,
  cursoId
) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    WHERE d.user_id = $1
      AND dc.aula_id = $2
      AND dc.curso_id = $3
    LIMIT 1
  `;

  const result = await pool.query(query, [
    teacherUserId,
    aulaId,
    cursoId
  ]);

  return result.rows.length > 0;
};

export const teacherCanAccessStudentGrades = async (
  teacherUserId,
  studentId
) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    INNER JOIN matriculas m
      ON m.aula_id = dc.aula_id
      AND m.estado = 'aprobado'
    WHERE d.user_id = $1
      AND m.estudiante_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [
    teacherUserId,
    studentId
  ]);

  return result.rows.length > 0;
};

export const studentOwnsGrades = async (studentUserId, studentId) => {
  const query = `
    SELECT id
    FROM estudiantes
    WHERE user_id = $1
      AND id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [
    studentUserId,
    studentId
  ]);

  return result.rows.length > 0;
};

export const guardianCanAccessGrades = async (
  guardianUserId,
  studentId
) => {
  const query = `
    SELECT ea.id
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea
      ON ea.apoderado_id = ap.id
    WHERE ap.user_id = $1
      AND ea.estudiante_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [
    guardianUserId,
    studentId
  ]);

  return result.rows.length > 0;
};

export const getStudentProfileByUserId = async (userId) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni
    FROM estudiantes e
    INNER JOIN users u ON e.user_id = u.id
    WHERE e.user_id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

export const getGuardianChildrenForGrades = async (guardianUserId) => {
  const query = `
    SELECT
      ea.parentesco,
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea
      ON ea.apoderado_id = ap.id
    INNER JOIN estudiantes e
      ON ea.estudiante_id = e.id
    INNER JOIN users u
      ON e.user_id = u.id
    WHERE ap.user_id = $1
      AND e.estado = 'activo'
    ORDER BY u.apellidos ASC, u.nombres ASC
  `;

  const result = await pool.query(query, [guardianUserId]);
  return result.rows;
};

export const getAcademicAlerts = async ({
  estado,
  userId,
  rol
} = {}) => {
  const values = [];

  let query = `
    SELECT
      aa.id,
      aa.nota_id,
      aa.estudiante_id,
      aa.curso_id,
      aa.aula_id,
      aa.periodo_id,
      aa.bimestre,
      aa.nota_detectada,
      aa.tipo,
      aa.mensaje,
      aa.estado,
      aa.generada_por,
      aa.resuelta_por,
      aa.fecha_resolucion,
      aa.observacion_resolucion,
      aa.created_at,
      aa.updated_at,

      e.codigo_estudiante,
      ue.nombres || ' ' || ue.apellidos AS estudiante,
      ue.dni AS estudiante_dni,

      c.nombre AS curso,

      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,

      p.nombre AS periodo,

      ug.nombres || ' ' || ug.apellidos AS generada_por_nombre,
      ur.nombres || ' ' || ur.apellidos AS resuelta_por_nombre
    FROM alertas_academicas aa
    INNER JOIN estudiantes e
      ON aa.estudiante_id = e.id
    INNER JOIN users ue
      ON e.user_id = ue.id
    INNER JOIN cursos c
      ON aa.curso_id = c.id
    INNER JOIN aulas a
      ON aa.aula_id = a.id
    INNER JOIN grados g
      ON a.grado_id = g.id
    INNER JOIN secciones s
      ON a.seccion_id = s.id
    INNER JOIN periodos_academicos p
      ON aa.periodo_id = p.id
    LEFT JOIN users ug
      ON aa.generada_por = ug.id
    LEFT JOIN users ur
      ON aa.resuelta_por = ur.id
    WHERE aa.tipo = 'bajo_rendimiento'
  `;

  if (estado && ['activa', 'resuelta'].includes(estado)) {
    values.push(estado);

    query += `
      AND aa.estado = $${values.length}
    `;
  }

  if (rol === 'Docente') {
    values.push(userId);

    query += `
      AND EXISTS (
        SELECT 1
        FROM docentes d
        INNER JOIN docente_curso dc
          ON dc.docente_id = d.id
        WHERE d.user_id = $${values.length}
          AND dc.aula_id = aa.aula_id
          AND dc.curso_id = aa.curso_id
      )
    `;
  }

  query += `
    ORDER BY
      CASE WHEN aa.estado = 'activa' THEN 0 ELSE 1 END,
      aa.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

const teacherCanResolveAcademicAlert = async ({
  alertId,
  userId
}) => {
  const result = await pool.query(
    `
    SELECT aa.id
    FROM alertas_academicas aa
    INNER JOIN docentes d
      ON d.user_id = $2
    INNER JOIN docente_curso dc
      ON dc.docente_id = d.id
      AND dc.aula_id = aa.aula_id
      AND dc.curso_id = aa.curso_id
    WHERE aa.id = $1
    LIMIT 1
    `,
    [
      alertId,
      userId
    ]
  );

  return result.rows.length > 0;
};

export const resolveAcademicAlert = async ({
  id,
  resolvedBy,
  rol,
  observacion
}) => {
  if (rol === 'Docente') {
    const canResolve = await teacherCanResolveAcademicAlert({
      alertId: id,
      userId: resolvedBy
    });

    if (!canResolve) {
      throw new Error('Solo puedes resolver alertas de tus cursos asignados');
    }
  }

  const result = await pool.query(
    `
    UPDATE alertas_academicas
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
      observacion || 'Alerta académica marcada como resuelta manualmente.'
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('La alerta académica no existe o ya fue resuelta');
  }

  return result.rows[0];
};