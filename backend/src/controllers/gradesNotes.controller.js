import {
  getStudentsForGrades,
  saveGrades,
  getGradesByClassroomCourseBimester,
  getGradesByStudent,
  getGradesSummaryByClassroomCourse,
  getStudentsAtRisk,
  teacherCanAccessClassroom,
  teacherCanAccessClassroomCourse,
  teacherCanAccessStudentGrades,
  studentOwnsGrades,
  guardianCanAccessGrades,
  getStudentProfileByUserId,
  getGuardianChildrenForGrades
} from '../services/gradesNotes.service.js';

export const getClassroomStudentsForGrades = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { periodo_id } = req.query;

    if (!periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El período académico es obligatorio'
      });
    }

    const { id: userId, rol } = req.user;

      if (rol === 'Docente') {
        const canAccess = await teacherCanAccessClassroom(userId, aulaId);

        if (!canAccess) {
          return res.status(403).json({
            success: false,
            error: 'Solo puedes consultar estudiantes de tus aulas asignadas'
          });
        }
      }

    const students = await getStudentsForGrades(aulaId, periodo_id);

    res.json({ success: true, data: students });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registerGrades = async (req, res) => {
  try {
    const {
      aula_id,
      curso_id,
      periodo_id,
      bimestre,
      notas
    } = req.body;

    if (
      !aula_id ||
      !curso_id ||
      !periodo_id ||
      !bimestre ||
      !Array.isArray(notas)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Aula, curso, período, bimestre y lista de notas son obligatorios'
      });
    }

    if (notas.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'La lista de notas no puede estar vacía'
      });
    }

    const { id: userId, rol } = req.user;

      if (rol === 'Docente') {
        const canAccess = await teacherCanAccessClassroomCourse(
          userId,
          aula_id,
          curso_id
        );

        if (!canAccess) {
          return res.status(403).json({
            success: false,
            error: 'Solo puedes registrar notas de tus cursos y aulas asignadas'
          });
        }
      }

    const result = await saveGrades({
      aula_id,
      curso_id,
      periodo_id,
      bimestre,
      notas
    });

    res.status(201).json({
      success: true,
      message: 'Notas registradas correctamente',
      data: result
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassroomCourseGrades = async (req, res) => {
  try {
    const { aulaId, cursoId, bimestre } = req.params;
    const { periodo_id } = req.query;

    if (!bimestre || !periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre y el período académico son obligatorios'
      });
    }

    const { id: userId, rol } = req.user;

      if (rol === 'Docente') {
        const canAccess = await teacherCanAccessClassroomCourse(
          userId,
          aulaId,
          cursoId
        );

        if (!canAccess) {
          return res.status(403).json({
            success: false,
            error: 'Solo puedes consultar notas de tus cursos asignados'
          });
        }
      }

    const grades = await getGradesByClassroomCourseBimester(
      aulaId,
      cursoId,
      bimestre,
      periodo_id
    );

    res.json({ success: true, data: grades });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { periodo_id } = req.query;
    const { id: userId, rol } = req.user;

    if (rol === 'Estudiante') {
      const ownsGrades = await studentOwnsGrades(userId, studentId);

      if (!ownsGrades) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver estas notas'
        });
      }
    }

    if (rol === 'Apoderado') {
      const canAccess = await guardianCanAccessGrades(userId, studentId);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver las notas de este estudiante'
        });
      }
    }

    if (rol === 'Docente') {
      const canAccess = await teacherCanAccessStudentGrades(
        userId,
        studentId
      );

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes ver notas de estudiantes de tus aulas asignadas'
        });
      }
    }

    const grades = await getGradesByStudent(studentId, periodo_id || null);

    res.json({ success: true, data: grades });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassroomCourseSummary = async (req, res) => {
  try {
    const { aulaId, cursoId } = req.params;
    const { bimestre, periodo_id } = req.query;

    if (!bimestre || !periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre y el período académico son obligatorios'
      });
    }

    const { id: userId, rol } = req.user;

    if (rol === 'Docente') {
      const canAccess = await teacherCanAccessClassroomCourse(
        userId,
        aulaId,
        cursoId
      );

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes consultar notas de tus cursos asignados'
        });
      }
    }

    const summary = await getGradesSummaryByClassroomCourse(
      aulaId,
      cursoId,
      bimestre,
      periodo_id
    );

    res.json({ success: true, data: summary });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRiskStudents = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { bimestre, periodo_id } = req.query;

    if (!bimestre || !periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre y el período académico son obligatorios'
      });
    }

    const { id: userId, rol } = req.user;

    if (rol === 'Docente') {
      const canAccess = await teacherCanAccessClassroom(userId, aulaId);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes consultar estudiantes de tus aulas asignadas'
        });
      }
    }

    const students = await getStudentsAtRisk(
      aulaId,
      bimestre,
      periodo_id
    );

    res.json({ success: true, data: students });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyGrades = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    const { periodo_id } = req.query;

    if (rol === 'Estudiante') {
      const student = await getStudentProfileByUserId(userId);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró el perfil del estudiante'
        });
      }

      const grades = await getGradesByStudent(
        student.estudiante_id,
        periodo_id || null
      );

      return res.json({
        success: true,
        type: 'student',
        data: {
          student,
          grades
        }
      });
    }

    if (rol === 'Apoderado') {
      const children = await getGuardianChildrenForGrades(userId);

      const childrenWithGrades = [];

      for (const child of children) {
        const grades = await getGradesByStudent(
          child.estudiante_id,
          periodo_id || null
        );

        childrenWithGrades.push({
          student: child,
          grades
        });
      }

      return res.json({
        success: true,
        type: 'guardian',
        data: {
          children: childrenWithGrades
        }
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Este recurso solo está disponible para estudiantes y apoderados'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};