import pool from '../config/db.js';

const gradePoints = {
  AD: 4,
  A: 3,
  B: 2,
  C: 1
};

const bimesters = ['B1', 'B2', 'B3', 'B4'];

const calculateCourseFinalGrade = (course, grades) => {
  const gradesByBimester = {
    B1: null,
    B2: null,
    B3: null,
    B4: null
  };

  const commentsByBimester = {
    B1: null,
    B2: null,
    B3: null,
    B4: null
  };

  let totalPoints = 0;

  grades.forEach((grade) => {
    gradesByBimester[grade.bimestre] = grade.nota;
    commentsByBimester[grade.bimestre] = grade.comentario || null;
    totalPoints += gradePoints[grade.nota] || 0;
  });

  let baseBimester = null;
  let baseGrade = null;

  for (let i = bimesters.length - 1; i >= 0; i--) {
    const bimester = bimesters[i];

    if (gradesByBimester[bimester]) {
      baseBimester = bimester;
      baseGrade = gradesByBimester[bimester];
      break;
    }
  }

  if (!baseGrade) {
    return {
      curso_id: course.curso_id,
      curso: course.curso,
      bimestres: gradesByBimester,
      comentarios: commentsByBimester,
      bimestre_base: null,
      nota_base: null,
      nota_final: null,
      ajuste_aplicado: false,
      motivo_ajuste: null,
      puntos_acumulados: totalPoints,
      estado: 'sin_notas'
    };
  }

  const baseIndex = bimesters.indexOf(baseBimester);
  const previousBimesters = bimesters.slice(0, baseIndex);

  const previousCCount = previousBimesters.filter(
    (bimester) => gradesByBimester[bimester] === 'C'
  ).length;

  let finalGrade = baseGrade;
  let adjustmentApplied = false;
  let adjustmentReason = null;

  if (['AD', 'A'].includes(baseGrade) && previousCCount >= 2) {
    finalGrade = 'B';
    adjustmentApplied = true;
    adjustmentReason =
      'La nota final fue ajustada a B porque el estudiante tuvo dos o más C en bimestres anteriores.';
  }

  return {
    curso_id: course.curso_id,
    curso: course.curso,
    bimestres: gradesByBimester,
    comentarios: commentsByBimester,
    bimestre_base: baseBimester,
    nota_base: baseGrade,
    nota_final: finalGrade,
    ajuste_aplicado: adjustmentApplied,
    motivo_ajuste: adjustmentReason,
    puntos_acumulados: totalPoints,
    estado: 'calculado'
  };
};

const calculateAnnualStatus = (courses) => {
  const pendingCourses = courses.filter((course) => !course.nota_final).length;

  const coursesWithC = courses.filter(
    (course) => course.nota_final === 'C'
  ).length;

  if (pendingCourses > 0) {
    return {
      estado_anual: 'Incompleto',
      cursos_con_c: coursesWithC,
      cursos_pendientes: pendingCourses,
      observacion:
        'Existen cursos sin nota registrada, por lo que no se puede determinar la situación anual definitiva.'
    };
  }

  if (coursesWithC === 0) {
    return {
      estado_anual: 'Promovido',
      cursos_con_c: coursesWithC,
      cursos_pendientes: 0,
      observacion: 'El estudiante no presenta cursos con nota final C.'
    };
  }

  if (coursesWithC >= 1 && coursesWithC <= 3) {
    return {
      estado_anual: 'Recuperación',
      cursos_con_c: coursesWithC,
      cursos_pendientes: 0,
      observacion:
        'El estudiante debe participar en recuperación académica por tener de 1 a 3 cursos con nota final C.'
    };
  }

  return {
    estado_anual: 'Repitente',
    cursos_con_c: coursesWithC,
    cursos_pendientes: 0,
    observacion:
      'El estudiante presenta 4 o más cursos con nota final C.'
  };
};


  const buildMeritMetrics = (annualCourses) => {
    const finalGrades = annualCourses
      .map((course) => course.nota_final)
      .filter(Boolean);

    return {
      total_ad_final: finalGrades.filter((grade) => grade === 'AD').length,
      total_a_final: finalGrades.filter((grade) => grade === 'A').length,
      total_b_final: finalGrades.filter((grade) => grade === 'B').length,
      total_c_final: finalGrades.filter((grade) => grade === 'C').length
    };
  };

  const applyMeritRanking = (studentsResults) => {
    const sorted = [...studentsResults].sort((a, b) => {
      const pointsDiff =
        Number(b.summary.puntos_totales || 0) -
        Number(a.summary.puntos_totales || 0);

      if (pointsDiff !== 0) return pointsDiff;

      const adDiff =
        Number(b.summary.total_ad_final || 0) -
        Number(a.summary.total_ad_final || 0);

      if (adDiff !== 0) return adDiff;

      const aDiff =
        Number(b.summary.total_a_final || 0) -
        Number(a.summary.total_a_final || 0);

      if (aDiff !== 0) return aDiff;

      const cDiff =
        Number(a.summary.total_c_final || 0) -
        Number(b.summary.total_c_final || 0);

      if (cDiff !== 0) return cDiff;

      const lastNameA = `${a.student.apellidos || ''} ${a.student.nombres || ''}`.toLowerCase();
      const lastNameB = `${b.student.apellidos || ''} ${b.student.nombres || ''}`.toLowerCase();

      return lastNameA.localeCompare(lastNameB);
    });

    let previousKey = null;
    let previousRank = 0;

    return sorted.map((item, index) => {
      const currentKey = [
        item.summary.puntos_totales,
        item.summary.total_ad_final,
        item.summary.total_a_final,
        item.summary.total_c_final
      ].join('-');

      const rank = currentKey === previousKey
        ? previousRank
        : index + 1;

      previousKey = currentKey;
      previousRank = rank;

      return {
        ...item,
        summary: {
          ...item.summary,
          puesto_merito: rank,
          total_estudiantes_aula: sorted.length
        }
      };
    });
  };  

export const getStudentEnrollmentForAnnualResult = async (
  studentId,
  periodoId
) => {
  const query = `
    SELECT
      e.id AS estudiante_id,
      e.codigo_estudiante,
      u.nombres,
      u.apellidos,
      u.dni,
      m.id AS matricula_id,
      m.periodo_id,
      p.nombre AS periodo,
      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno
    FROM estudiantes e
    INNER JOIN users u ON e.user_id = u.id
    INNER JOIN matriculas m ON e.id = m.estudiante_id
    INNER JOIN periodos_academicos p ON m.periodo_id = p.id
    INNER JOIN aulas a ON m.aula_id = a.id
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    WHERE e.id = $1
      AND m.periodo_id = $2
      AND m.estado = 'aprobado'
    ORDER BY m.created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [studentId, periodoId]);
  return result.rows[0];
};

export const getCoursesForAnnualResult = async (
  aulaId,
  studentId,
  periodoId
) => {
  const query = `
    SELECT DISTINCT
      c.id AS curso_id,
      c.nombre AS curso
    FROM cursos c
    WHERE c.id IN (
      SELECT dc.curso_id
      FROM docente_curso dc
      WHERE dc.aula_id = $1

      UNION

      SELECT n.curso_id
      FROM notas n
      WHERE n.aula_id = $1
        AND n.estudiante_id = $2
        AND n.periodo_id = $3
    )
    ORDER BY c.nombre ASC
  `;

  const result = await pool.query(query, [
    aulaId,
    studentId,
    periodoId
  ]);

  return result.rows;
};

export const getStudentGradesForAnnualResult = async (
  studentId,
  aulaId,
  periodoId
) => {
  const query = `
    SELECT
      n.id,
      n.estudiante_id,
      n.curso_id,
      c.nombre AS curso,
      n.aula_id,
      n.periodo_id,
      n.bimestre,
      n.nota,
      n.comentario,
      n.created_at
    FROM notas n
    INNER JOIN cursos c ON n.curso_id = c.id
    WHERE n.estudiante_id = $1
      AND n.aula_id = $2
      AND n.periodo_id = $3
    ORDER BY c.nombre ASC, n.bimestre ASC
  `;

  const result = await pool.query(query, [
    studentId,
    aulaId,
    periodoId
  ]);

  return result.rows;
};

export const buildStudentAnnualResult = async (
  studentId,
  periodoId
) => {
  const student = await getStudentEnrollmentForAnnualResult(
    studentId,
    periodoId
  );

  if (!student) {
    return null;
  }

  const courses = await getCoursesForAnnualResult(
    student.aula_id,
    studentId,
    periodoId
  );

  const grades = await getStudentGradesForAnnualResult(
    studentId,
    student.aula_id,
    periodoId
  );

  const annualCourses = courses.map((course) => {
    const courseGrades = grades.filter(
      (grade) => Number(grade.curso_id) === Number(course.curso_id)
    );

    return calculateCourseFinalGrade(course, courseGrades);
  });

  const annualStatus = calculateAnnualStatus(annualCourses);

  const totalPoints = annualCourses.reduce(
    (sum, course) => sum + Number(course.puntos_acumulados || 0),
    0
  );
  const meritMetrics = buildMeritMetrics(annualCourses);

  return {
    student,
    courses: annualCourses,
    summary: {
      total_cursos: annualCourses.length,
      cursos_calificados: annualCourses.filter((course) => course.nota_final).length,
      cursos_pendientes: annualStatus.cursos_pendientes,
      cursos_con_c: annualStatus.cursos_con_c,
      puntos_totales: totalPoints,
      total_ad_final: meritMetrics.total_ad_final,
      total_a_final: meritMetrics.total_a_final,
      total_b_final: meritMetrics.total_b_final,
      total_c_final: meritMetrics.total_c_final,
      puesto_merito: null,
      total_estudiantes_aula: null,
      estado_anual: annualStatus.estado_anual,
      observacion: annualStatus.observacion
    }
  };
};

export const getStudentsByClassroomForAnnualResult = async (
  aulaId,
  periodoId
) => {
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

export const getClassroomInfoForAnnualResult = async (
  aulaId,
  periodoId
) => {
  const query = `
    SELECT
      a.id AS aula_id,
      g.nombre AS grado,
      s.nombre AS seccion,
      a.turno,
      p.id AS periodo_id,
      p.nombre AS periodo
    FROM aulas a
    INNER JOIN grados g ON a.grado_id = g.id
    INNER JOIN secciones s ON a.seccion_id = s.id
    CROSS JOIN periodos_academicos p
    WHERE a.id = $1
      AND p.id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [aulaId, periodoId]);
  return result.rows[0];
};

export const buildClassroomAnnualResults = async (
  aulaId,
  periodoId
) => {
  const classroom = await getClassroomInfoForAnnualResult(
    aulaId,
    periodoId
  );

  if (!classroom) {
    return null;
  }

  const students = await getStudentsByClassroomForAnnualResult(
    aulaId,
    periodoId
  );

  const results = [];

  for (const student of students) {
    const result = await buildStudentAnnualResult(
      student.estudiante_id,
      periodoId
    );

    if (result) {
      results.push(result);
    }
  }

  const rankedResults = applyMeritRanking(results);

  return {
    classroom,
    students: rankedResults
  };
};

export const buildClassroomAnnualSummary = async (
  aulaId,
  periodoId
) => {
  const annualResults = await buildClassroomAnnualResults(
    aulaId,
    periodoId
  );

  if (!annualResults) {
    return null;
  }

  const promoted = annualResults.students.filter(
    (item) => item.summary.estado_anual === 'Promovido'
  ).length;

  const recovery = annualResults.students.filter(
    (item) => item.summary.estado_anual === 'Recuperación'
  ).length;

  const repeated = annualResults.students.filter(
    (item) => item.summary.estado_anual === 'Repitente'
  ).length;

  const incomplete = annualResults.students.filter(
    (item) => item.summary.estado_anual === 'Incompleto'
  ).length;

  return {
    classroom: annualResults.classroom,
    summary: {
      total_estudiantes: annualResults.students.length,
      promovidos: promoted,
      recuperacion: recovery,
      repitentes: repeated,
      incompletos: incomplete
    }
  };
};

export const studentOwnsAnnualResult = async (userId, studentId) => {
  const query = `
    SELECT id
    FROM estudiantes
    WHERE user_id = $1
      AND id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [userId, studentId]);
  return result.rows.length > 0;
};

export const guardianCanAccessAnnualResult = async (
  guardianUserId,
  studentId
) => {
  const query = `
    SELECT ea.id
    FROM apoderados ap
    INNER JOIN estudiante_apoderado ea ON ap.id = ea.apoderado_id
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

export const teacherCanAccessAnnualStudent = async (
  teacherUserId,
  studentId,
  periodoId
) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    INNER JOIN matriculas m
      ON m.aula_id = dc.aula_id
      AND m.estado = 'aprobado'
      AND m.periodo_id = $3
    WHERE d.user_id = $1
      AND m.estudiante_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [
    teacherUserId,
    studentId,
    periodoId
  ]);

  return result.rows.length > 0;
};

export const teacherCanAccessAnnualClassroom = async (
  teacherUserId,
  aulaId
) => {
  const query = `
    SELECT dc.id
    FROM docentes d
    INNER JOIN docente_curso dc ON dc.docente_id = d.id
    WHERE d.user_id = $1
      AND dc.aula_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [
    teacherUserId,
    aulaId
  ]);

  return result.rows.length > 0;
};

export const getStudentProfileForAnnualResult = async (userId) => {
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

export const getGuardianChildrenForAnnualResult = async (guardianUserId) => {
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

export const buildStudentAnnualResultWithRanking = async (
  studentId,
  periodoId
) => {
  const baseResult = await buildStudentAnnualResult(studentId, periodoId);

  if (!baseResult) {
    return null;
  }

  const classroomResults = await buildClassroomAnnualResults(
    baseResult.student.aula_id,
    periodoId
  );

  const rankedStudent = classroomResults?.students?.find(
    (item) =>
      Number(item.student.estudiante_id) === Number(studentId)
  );

  return rankedStudent || baseResult;
};