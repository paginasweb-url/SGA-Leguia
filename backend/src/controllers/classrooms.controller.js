import {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom
} from '../services/classrooms.service.js';

export const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await getClassrooms();

    res.json({
      success: true,
      data: classrooms
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await getClassroomById(id);

    res.json({
      success: true,
      data: classroom
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewClassroom = async (req, res) => {
  try {
    const { grado_id, seccion_id, turno } = req.body;

    if (!grado_id || !seccion_id || !turno) {
      return res.status(400).json({
        success: false,
        error: 'Grado, sección y turno son obligatorios'
      });
    }

    const classroom = await createClassroom(req.body);

    res.status(201).json({
      success: true,
      data: classroom
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await updateClassroom(id, req.body);

    res.json({
      success: true,
      data: classroom
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await deleteClassroom(id);

    res.json({
      success: true,
      data: classroom
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};