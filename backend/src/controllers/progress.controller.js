import {
  getStudentByUserId,
  getGuardianChildren,
  guardianCanAccessStudent,
  studentOwnsProfile,
  teacherCanAccessStudent,
  buildStudentProgress,
  getAnnouncementsForProgress
} from '../services/progress.service.js';

export const getMyProgress = async (req, res) => {
  try {
    const { id, rol } = req.user;

    if (rol === 'Estudiante') {
      const student = await getStudentByUserId(id);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró el perfil del estudiante'
        });
      }

      const progress = await buildStudentProgress(student.estudiante_id);
      const announcements = await getAnnouncementsForProgress(id, rol);

      return res.json({
        success: true,
        type: 'student',
        data: {
          ...progress,
          announcements
        }
      });
    }

    if (rol === 'Apoderado') {
      const children = await getGuardianChildren(id);

      const childrenProgress = [];

      for (const child of children) {
        const progress = await buildStudentProgress(child.estudiante_id);

        childrenProgress.push({
          ...progress,
          parentesco: child.parentesco
        });
      }

      const announcements = await getAnnouncementsForProgress(id, rol);

      return res.json({
        success: true,
        type: 'guardian',
        data: {
          children: childrenProgress,
          announcements
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

export const getProgressByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { id, rol } = req.user;

    if (rol === 'Estudiante') {
      const ownsProfile = await studentOwnsProfile(id, studentId);

      if (!ownsProfile) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver este progreso'
        });
      }
    }

    if (rol === 'Apoderado') {
    const canAccess = await guardianCanAccessStudent(id, studentId);

    if (!canAccess) {
        return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver el progreso de este estudiante'
        });
    }
    }

    if (rol === 'Docente') {
    const canAccess = await teacherCanAccessStudent(id, studentId);

    if (!canAccess) {
        return res.status(403).json({
        success: false,
        error: 'Solo puedes ver el progreso de estudiantes de tus aulas asignadas'
        });
    }
    }

    const progress = await buildStudentProgress(studentId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Estudiante no encontrado'
      });
    }

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};