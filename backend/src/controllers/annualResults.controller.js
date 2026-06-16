import {
  buildStudentAnnualResult,
  buildStudentAnnualResultWithRanking,
  buildClassroomAnnualResults,
  buildClassroomAnnualSummary,
  studentOwnsAnnualResult,
  guardianCanAccessAnnualResult,
  teacherCanAccessAnnualStudent,
  teacherCanAccessAnnualClassroom,
  getStudentProfileForAnnualResult,
  getGuardianChildrenForAnnualResult
} from '../services/annualResults.service.js';

export const getStudentAnnualResult = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { periodo_id } = req.query;
    const { id: userId, rol } = req.user;

    if (!periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El período académico es obligatorio'
      });
    }

    if (rol === 'Estudiante') {
      const ownsResult = await studentOwnsAnnualResult(userId, studentId);

      if (!ownsResult) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver este resultado anual'
        });
      }
    }

    if (rol === 'Apoderado') {
      const canAccess = await guardianCanAccessAnnualResult(userId, studentId);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver el resultado anual de este estudiante'
        });
      }
    }

    if (rol === 'Docente') {
      const canAccess = await teacherCanAccessAnnualStudent(
        userId,
        studentId,
        periodo_id
      );

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes ver resultados de estudiantes de tus aulas asignadas'
        });
      }
    }

    const result = await buildStudentAnnualResultWithRanking(studentId, periodo_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró matrícula aprobada para el estudiante en el período indicado'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getMyAnnualResult = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    const { periodo_id } = req.query;

    if (!periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El período académico es obligatorio'
      });
    }

    if (rol === 'Estudiante') {
      const student = await getStudentProfileForAnnualResult(userId);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró el perfil del estudiante'
        });
      }

      const result = await buildStudentAnnualResultWithRanking(
        student.estudiante_id,
        periodo_id
      );

      return res.json({
        success: true,
        type: 'student',
        data: result
      });
    }

    if (rol === 'Apoderado') {
      const children = await getGuardianChildrenForAnnualResult(userId);

      const results = [];

      for (const child of children) {
        const annualResult = await buildStudentAnnualResultWithRanking(
          child.estudiante_id,
          periodo_id
        );

        if (annualResult) {
          results.push({
            parentesco: child.parentesco,
            result: annualResult
          });
        }
      }

      return res.json({
        success: true,
        type: 'guardian',
        data: {
          children: results
        }
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Este recurso solo está disponible para estudiantes y apoderados'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getClassroomAnnualResults = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { periodo_id } = req.query;
    const { id: userId, rol } = req.user;

    if (!periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El período académico es obligatorio'
      });
    }

    if (rol === 'Docente') {
      const canAccess = await teacherCanAccessAnnualClassroom(userId, aulaId);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes ver resultados de tus aulas asignadas'
        });
      }
    }

    const result = await buildClassroomAnnualResults(aulaId, periodo_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Aula o período académico no encontrado'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getClassroomAnnualSummary = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { periodo_id } = req.query;
    const { id: userId, rol } = req.user;

    if (!periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El período académico es obligatorio'
      });
    }

    if (rol === 'Docente') {
      const canAccess = await teacherCanAccessAnnualClassroom(userId, aulaId);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes ver resultados de tus aulas asignadas'
        });
      }
    }

    const result = await buildClassroomAnnualSummary(aulaId, periodo_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Aula o período académico no encontrado'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};