import {
  getGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade
} from '../services/grades.service.js';

export const getAllGrades = async (req, res) => {
  try {
    const grades = await getGrades();

    res.json({
      success: true,
      data: grades
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await getGradeById(id);

    res.json({
      success: true,
      data: grade
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewGrade = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del grado es obligatorio'
      });
    }

    const grade = await createGrade(nombre);

    res.status(201).json({
      success: true,
      data: grade
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const grade = await updateGrade(id, nombre);

    res.json({
      success: true,
      data: grade
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await deleteGrade(id);

    res.json({
      success: true,
      data: grade
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};