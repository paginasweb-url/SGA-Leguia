import {
  linkGuardianToStudent,
  getGuardiansByStudent,
  getStudentsByGuardian,
  unlinkGuardianStudent
} from '../services/guardianStudent.service.js';

export const createGuardianStudentLink = async (req, res) => {
  try {
    const { estudiante_id, apoderado_id, parentesco } = req.body;

    if (!estudiante_id || !apoderado_id || !parentesco) {
      return res.status(400).json({
        success: false,
        error: 'Estudiante, apoderado y parentesco son obligatorios'
      });
    }

    const relation = await linkGuardianToStudent({
      estudiante_id,
      apoderado_id,
      parentesco
    });

    res.status(201).json({
      success: true,
      message: 'Apoderado vinculado correctamente al estudiante',
      data: relation
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getStudentGuardians = async (req, res) => {
  try {
    const { studentId } = req.params;

    const guardians = await getGuardiansByStudent(studentId);

    res.json({
      success: true,
      data: guardians
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getGuardianStudents = async (req, res) => {
  try {
    const { guardianId } = req.params;

    const students = await getStudentsByGuardian(guardianId);

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteGuardianStudentLink = async (req, res) => {
  try {
    const { relationId } = req.params;

    const relation = await unlinkGuardianStudent(relationId);

    res.json({
      success: true,
      message: 'Vinculación eliminada correctamente',
      data: relation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};