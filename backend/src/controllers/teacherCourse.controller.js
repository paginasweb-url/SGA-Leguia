import {
  getTeacherCourses,
  createTeacherCourse,
  getTeacherCoursesByTeacher,
  getTeacherCoursesByClassroom,
  deleteTeacherCourse
} from '../services/teacherCourse.service.js';

export const getAllTeacherCourses = async (req, res) => {
  try {
    const assignments = await getTeacherCourses();

    res.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewTeacherCourse = async (req, res) => {
  try {
    const { docente_id, curso_id, aula_id } = req.body;

    if (!docente_id || !curso_id || !aula_id) {
      return res.status(400).json({
        success: false,
        error: 'Docente, curso y aula son obligatorios'
      });
    }

    const assignment = await createTeacherCourse(req.body);

    res.status(201).json({
      success: true,
      message: 'Asignación creada correctamente',
      data: assignment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAssignmentsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const assignments = await getTeacherCoursesByTeacher(teacherId);

    res.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAssignmentsByClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const assignments = await getTeacherCoursesByClassroom(classroomId);

    res.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingTeacherCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await deleteTeacherCourse(id);

    res.json({
      success: true,
      message: 'Asignación eliminada correctamente',
      data: assignment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};