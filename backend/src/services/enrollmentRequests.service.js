import pool from '../config/db.js';
import supabase from '../config/supabase.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateCredentials } from '../utils/generateCredentials.js';

export const createEnrollmentRequest = async (data) => {
  const {
    estudiante_dni,
    estudiante_nombres,
    estudiante_apellidos,
    estudiante_fecha_nacimiento,
    estudiante_direccion,
    apoderado_dni,
    apoderado_nombres,
    apoderado_apellidos,
    apoderado_telefono,
    apoderado_direccion,
    parentesco,
    grado_id,
    turno,
    periodo_id
  } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertResult = await client.query(`
      INSERT INTO solicitudes_matricula (
        estudiante_dni,
        estudiante_nombres,
        estudiante_apellidos,
        estudiante_fecha_nacimiento,
        estudiante_direccion,
        apoderado_dni,
        apoderado_nombres,
        apoderado_apellidos,
        apoderado_telefono,
        apoderado_direccion,
        parentesco,
        grado_id,
        seccion_id,
        turno,
        periodo_id,
        estado,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, NULL, $13, $14,
        'pendiente', NOW(), NOW()
      )
      RETURNING *;
    `, [
      estudiante_dni,
      estudiante_nombres,
      estudiante_apellidos,
      estudiante_fecha_nacimiento,
      estudiante_direccion,
      apoderado_dni,
      apoderado_nombres,
      apoderado_apellidos,
      apoderado_telefono,
      apoderado_direccion,
      parentesco,
      grado_id,
      turno,
      periodo_id
    ]);

    const nuevaSolicitud = insertResult.rows[0];

    const year = new Date(nuevaSolicitud.created_at).getFullYear();
    const codigoSeguimiento = `SOL-${year}-${String(nuevaSolicitud.id).padStart(6, '0')}`;

    const updateResult = await client.query(`
      UPDATE solicitudes_matricula
      SET codigo_seguimiento = $1
      WHERE id = $2
      RETURNING *;
    `, [codigoSeguimiento, nuevaSolicitud.id]);

    await client.query('COMMIT');

    return updateResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const trackEnrollmentRequest = async ({
  codigo_seguimiento,
  estudiante_dni,
  apoderado_dni
}) => {
  const query = `
    SELECT
      sm.*,
      g.nombre AS grado,
      s.nombre AS seccion,
      p.nombre AS periodo,
      aa.id AS aula_asignada_id,
      sa.nombre AS seccion_asignada,
      aa.turno AS turno_asignado
    FROM solicitudes_matricula sm
    LEFT JOIN grados g ON sm.grado_id = g.id
    LEFT JOIN secciones s ON sm.seccion_id = s.id
    LEFT JOIN periodos_academicos p ON sm.periodo_id = p.id
    LEFT JOIN aulas aa ON sm.aula_id_asignada = aa.id
    LEFT JOIN secciones sa ON aa.seccion_id = sa.id
    WHERE sm.codigo_seguimiento = $1
      AND sm.estudiante_dni = $2
      AND sm.apoderado_dni = $3
  `;

  const requestResult = await pool.query(query, [
    codigo_seguimiento,
    estudiante_dni,
    apoderado_dni
  ]);

  if (requestResult.rows.length === 0) {
    return null;
  }

  const request = requestResult.rows[0];

  const documentsResult = await pool.query(
    `
    SELECT
      id,
      tipo_documento,
      nombre_archivo,
      storage_path,
      estado,
      observacion,
      created_at
    FROM documentos_solicitud_matricula
    WHERE solicitud_id = $1
    ORDER BY created_at DESC
    `,
    [request.id]
  );

  return {
    ...request,
    documentos: documentsResult.rows
  };
};

export const getEnrollmentRequests = async () => {
  const query = `
    SELECT
      sm.*,
      g.nombre AS grado,
      s.nombre AS seccion,
      p.nombre AS periodo,
      aa.id AS aula_asignada_id,
      sa.nombre AS seccion_asignada,
      aa.turno AS turno_asignado,
      aa.capacidad AS aula_capacidad
    FROM solicitudes_matricula sm
    LEFT JOIN grados g ON sm.grado_id = g.id
    LEFT JOIN secciones s ON sm.seccion_id = s.id
    LEFT JOIN periodos_academicos p ON sm.periodo_id = p.id
    LEFT JOIN aulas aa ON sm.aula_id_asignada = aa.id
    LEFT JOIN secciones sa ON aa.seccion_id = sa.id
    ORDER BY sm.created_at DESC
  `;

  const result = await pool.query(query);

  return result.rows;
};

export const getEnrollmentRequestById = async (id) => {
  const query = `
    SELECT
      sm.*,
      g.nombre AS grado,
      s.nombre AS seccion,
      p.nombre AS periodo,
      aa.id AS aula_asignada_id,
      sa.nombre AS seccion_asignada,
      aa.turno AS turno_asignado,
      aa.capacidad AS aula_capacidad
    FROM solicitudes_matricula sm
    LEFT JOIN grados g ON sm.grado_id = g.id
    LEFT JOIN secciones s ON sm.seccion_id = s.id
    LEFT JOIN periodos_academicos p ON sm.periodo_id = p.id
    LEFT JOIN aulas aa ON sm.aula_id_asignada = aa.id
    LEFT JOIN secciones sa ON aa.seccion_id = sa.id
    WHERE sm.id = $1
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

export const uploadEnrollmentDocument = async (requestId, file, tipoDocumento) => {
  const fileExtension = file.originalname.split('.').pop();

  const fileName = `${tipoDocumento}-${crypto.randomUUID()}.${fileExtension}`;

  const storagePath = `solicitudes/${requestId}/${fileName}`;
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }
  
  const query = `
    INSERT INTO documentos_solicitud_matricula (
      solicitud_id,
      tipo_documento,
      nombre_archivo,
      url_archivo,
      storage_path,
      estado,
      created_at
    )
    VALUES ($1,$2,$3,$4,$5,'pendiente',NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    requestId,
    tipoDocumento,
    file.originalname,
    storagePath,
    storagePath
  ]);

  return result.rows[0];
};

export const getDocumentsByEnrollmentRequest = async (requestId) => {
  const query = `
    SELECT *
    FROM documentos_solicitud_matricula
    WHERE solicitud_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [requestId]);

  return result.rows;
};

export const updateEnrollmentRequestStatus = async (
  id,
  estado,
  observacion
) => {

  const query = `
    UPDATE solicitudes_matricula
    SET
      estado = $1,
      observacion = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

  const result = await pool.query(query, [
    estado,
    observacion,
    id
  ]);

  return result.rows[0];
};

export const approveEnrollmentRequest = async (requestId, aulaIdAsignada) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `
      SELECT *
      FROM solicitudes_matricula
      WHERE id = $1
      `,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Solicitud de matrícula no encontrada');
    }

    const request = requestResult.rows[0];

    if (request.estado === 'aprobado') {
      throw new Error('La solicitud ya fue aprobada anteriormente');
    }

    if (!aulaIdAsignada) {
  throw new Error('Debe seleccionar un aula para aprobar la solicitud');
}

const classroomResult = await client.query(
    `
    SELECT
      a.id,
      a.grado_id,
      a.seccion_id,
      a.turno,
      a.capacidad,
      g.nombre AS grado,
      s.nombre AS seccion
    FROM aulas a
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE a.id = $1
    LIMIT 1
    `,
    [aulaIdAsignada]
  );

  if (classroomResult.rows.length === 0) {
    throw new Error('El aula seleccionada no existe');
  }

  const classroom = classroomResult.rows[0];

  if (Number(classroom.grado_id) !== Number(request.grado_id)) {
    throw new Error('El aula seleccionada no corresponde al grado solicitado');
  }

  if (classroom.turno !== request.turno) {
    throw new Error('El aula seleccionada no corresponde al turno solicitado');
  }

  const capacityResult = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM matriculas
    WHERE aula_id = $1
      AND periodo_id = $2
      AND estado = 'aprobado'
    `,
    [
      classroom.id,
      request.periodo_id
    ]
  );

  const totalMatriculados = capacityResult.rows[0].total;

  if (totalMatriculados >= classroom.capacidad) {
    throw new Error(
      `El aula seleccionada no tiene vacantes disponibles. Capacidad: ${classroom.capacidad}`
    );
  }

  const aulaId = classroom.id;

    const studentCredentials = generateCredentials(
      'Estudiante',
      request.estudiante_dni
    );

    const studentPasswordHash = await bcrypt.hash(
      request.estudiante_dni,
      10
    );

    const studentUserId = uuidv4();

    const studentUserResult = await client.query(
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      RETURNING id
      `,
      [
        studentUserId,
        5,
        request.estudiante_nombres,
        request.estudiante_apellidos,
        request.estudiante_dni,
        studentCredentials.username,
        studentCredentials.correo,
        null,
        studentPasswordHash,
        'activo',
        true
      ]
    );

    const studentResult = await client.query(
      `
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
      `,
      [
        studentUserResult.rows[0].id,
        studentCredentials.username,
        request.estudiante_fecha_nacimiento,
        request.estudiante_direccion,
        'activo'
      ]
    );

    const estudianteId = studentResult.rows[0].id;

    let apoderadoId;
    let guardianCredentialsResponse = null;

    const existingGuardianResult = await client.query(
      `
      SELECT
        a.id AS apoderado_id,
        u.id AS user_id
      FROM apoderados a
      INNER JOIN users u
        ON a.user_id = u.id
      WHERE u.dni = $1
      LIMIT 1
      `,
      [request.apoderado_dni]
    );

    if (existingGuardianResult.rows.length > 0) {
      apoderadoId = existingGuardianResult.rows[0].apoderado_id;

      const guardianUserResult = await client.query(
        `
        SELECT username, correo
        FROM users
        WHERE id = $1
        `,
        [existingGuardianResult.rows[0].user_id]
      );

      guardianCredentialsResponse = {
        username: guardianUserResult.rows[0].username,
        correo: guardianUserResult.rows[0].correo,
        password_inicial: 'Ya tenía cuenta registrada'
      };

    } else {
      const guardianCredentials = generateCredentials(
        'Apoderado',
        request.apoderado_dni
      );

      const guardianPasswordHash = await bcrypt.hash(
        request.apoderado_dni,
        10
      );

      const guardianUserId = uuidv4();

      const guardianUserResult = await client.query(
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
        RETURNING id
        `,
        [
          guardianUserId,
          6,
          request.apoderado_nombres,
          request.apoderado_apellidos,
          request.apoderado_dni,
          guardianCredentials.username,
          guardianCredentials.correo,
          request.apoderado_telefono,
          guardianPasswordHash,
          'activo',
          true
        ]
      );

      const guardianResult = await client.query(
        `
        INSERT INTO apoderados (
          user_id,
          created_at
        )
        VALUES ($1,NOW())
        RETURNING *
        `,
        [guardianUserResult.rows[0].id]
      );

      apoderadoId = guardianResult.rows[0].id;

      guardianCredentialsResponse = {
        username: guardianCredentials.username,
        correo: guardianCredentials.correo,
        password_inicial: request.apoderado_dni
      };
    }

    const existingLinkResult = await client.query(
      `
      SELECT id
      FROM estudiante_apoderado
      WHERE estudiante_id = $1
        AND apoderado_id = $2
      LIMIT 1
      `,
      [estudianteId, apoderadoId]
    );

    if (existingLinkResult.rows.length === 0) {
      await client.query(
        `
        INSERT INTO estudiante_apoderado (
          estudiante_id,
          apoderado_id,
          parentesco,
          created_at
        )
        VALUES ($1,$2,$3,NOW())
        `,
        [
          estudianteId,
          apoderadoId,
          request.parentesco
        ]
      );
    }

    const enrollmentResult = await client.query(
      `
      INSERT INTO matriculas (
        estudiante_id,
        aula_id,
        periodo_id,
        estado,
        fecha,
        observacion,
        created_at
      )
      VALUES ($1,$2,$3,$4,CURRENT_DATE,$5,NOW())
      RETURNING *
      `,
      [
        estudianteId,
        aulaId,
        request.periodo_id,
        'aprobado',
        'Matrícula generada automáticamente desde solicitud digital'
      ]
    );

    const matriculaId = enrollmentResult.rows[0].id;

    const documentsResult = await client.query(
      `
      SELECT *
      FROM documentos_solicitud_matricula
      WHERE solicitud_id = $1
      `,
      [requestId]
    );

    for (const document of documentsResult.rows) {
    await client.query(
      `
      INSERT INTO documentos_matricula (
        matricula_id,
        tipo_documento,
        nombre_archivo,
        url_archivo,
        storage_path,
        estado,
        observacion,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,'aprobado',$6,NOW())
      `,
      [
        matriculaId,
        document.tipo_documento,
        document.nombre_archivo,
        document.url_archivo,
        document.storage_path,
        document.observacion
      ]
    );
  }

  await client.query(
    `
    UPDATE documentos_solicitud_matricula
    SET estado = 'aprobado'
    WHERE solicitud_id = $1
    `,
    [requestId]
  );

    const credentialsPayload = {
      estudiante: {
        username: studentCredentials.username,
        correo: studentCredentials.correo,
        password_inicial: request.estudiante_dni
      },
      apoderado: guardianCredentialsResponse
    };

    const updatedRequestResult = await client.query(
      `
      UPDATE solicitudes_matricula
      SET
        estado = 'aprobado',
        seccion_id = $3,
        aula_id_asignada = $4,
        observacion = 'Solicitud aprobada y matrícula generada automáticamente',
        credenciales_generadas = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        requestId,
        credentialsPayload,
        classroom.seccion_id,
        aulaId
      ]
    );

    await client.query('COMMIT');

    return {
      solicitud: updatedRequestResult.rows[0],
      estudiante_id: estudianteId,
      apoderado_id: apoderadoId,
      matricula: enrollmentResult.rows[0],
      credenciales: credentialsPayload
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
};

export const getEnrollmentPublicOptions = async () => {
  const gradesResult = await pool.query(`
    SELECT DISTINCT
      g.id,
      g.nombre
    FROM aulas a
    INNER JOIN grados g ON a.grado_id = g.id
    ORDER BY g.id ASC
  `);

  const turnsResult = await pool.query(`
    SELECT DISTINCT turno
    FROM aulas
    ORDER BY turno ASC
  `);

  const periodsResult = await pool.query(`
    SELECT
      id,
      nombre
    FROM periodos_academicos
    ORDER BY id DESC
  `);

  return {
    grados: gradesResult.rows,
    turnos: turnsResult.rows.map((item) => item.turno),
    periodos: periodsResult.rows
  };
};

export const getAvailableClassroomsForEnrollment = async ({
  grado_id,
  turno,
  periodo_id
}) => {
  const query = `
    SELECT
      a.id AS aula_id,
      a.grado_id,
      g.nombre AS grado,
      a.seccion_id,
      s.nombre AS seccion,
      a.turno,
      a.capacidad,
      COUNT(m.id)::int AS matriculados,
      (a.capacidad - COUNT(m.id))::int AS vacantes
    FROM aulas a
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    LEFT JOIN matriculas m
      ON m.aula_id = a.id
      AND m.periodo_id = $3
      AND m.estado = 'aprobado'
    WHERE a.grado_id = $1
      AND a.turno = $2
      AND a.estado = 'activo'
    GROUP BY
      a.id,
      a.grado_id,
      g.nombre,
      a.seccion_id,
      s.nombre,
      a.turno,
      a.capacidad
    ORDER BY s.nombre ASC
  `;

  const result = await pool.query(query, [
    grado_id,
    turno,
    periodo_id
  ]);

  return result.rows;
};

export const downloadEnrollmentDocument = async (requestId, documentId) => {
  const documentResult = await pool.query(
    `
    SELECT
      id,
      solicitud_id,
      tipo_documento,
      nombre_archivo,
      storage_path
    FROM documentos_solicitud_matricula
    WHERE id = $1
      AND solicitud_id = $2
    LIMIT 1
    `,
    [documentId, requestId]
  );

  if (documentResult.rows.length === 0) {
    throw new Error('Documento no encontrado para esta solicitud');
  }

  const document = documentResult.rows[0];

  if (!document.storage_path) {
    throw new Error('El documento no tiene una ruta de almacenamiento válida');
  }

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .download(document.storage_path);

  if (error) {
    throw new Error(error.message);
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    fileName: document.nombre_archivo || `documento-${document.id}`,
    contentType: data.type || 'application/octet-stream'
  };
};