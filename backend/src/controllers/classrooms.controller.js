import {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deactivateClassroom
} from '../services/classrooms.service.js';

export const getAllClassrooms = async (req, res) => {
  try {
    const { estado } = req.query;

    const classrooms = await getClassrooms({
      estado
    });

    res.json({
      success: true,
      data: classrooms
    });

  } catch (error) {
    console.error(error);

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

    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Aula no encontrada'
      });
    }

    res.json({
      success: true,
      data: classroom
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewClassroom = async (req, res) => {
  try {
    const {
      grado_id,
      seccion_id,
      turno,
      capacidad,
      estado
    } = req.body;

    if (!grado_id || !seccion_id || !turno) {
      return res.status(400).json({
        success: false,
        error: 'Grado, sección y turno son obligatorios'
      });
    }

    if (capacidad !== undefined && Number(capacidad) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'La capacidad debe ser mayor a 0'
      });
    }

    if (estado && !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'El estado debe ser activo o inactivo'
      });
    }

    const classroom = await createClassroom({
      grado_id,
      seccion_id,
      turno,
      capacidad: capacidad || 35,
      estado: estado || 'activo'
    });

    res.status(201).json({
      success: true,
      message: 'Aula creada correctamente',
      data: classroom
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const existingClassroom = await getClassroomById(id);

    if (!existingClassroom) {
      return res.status(404).json({
        success: false,
        error: 'Aula no encontrada'
      });
    }

    const {
      grado_id,
      seccion_id,
      turno,
      capacidad,
      estado
    } = req.body;

    if (capacidad !== undefined && Number(capacidad) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'La capacidad debe ser mayor a 0'
      });
    }

    if (estado && !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'El estado debe ser activo o inactivo'
      });
    }

    if (
      capacidad !== undefined &&
      Number(capacidad) < Number(existingClassroom.matriculados || 0)
    ) {
      return res.status(400).json({
        success: false,
        error: `La capacidad no puede ser menor a los estudiantes matriculados (${existingClassroom.matriculados})`
      });
    }

    const classroom = await updateClassroom(id, {
      grado_id,
      seccion_id,
      turno,
      capacidad,
      estado
    });

    res.json({
      success: true,
      message: 'Aula actualizada correctamente',
      data: classroom
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const existingClassroom = await getClassroomById(id);

    if (!existingClassroom) {
      return res.status(404).json({
        success: false,
        error: 'Aula no encontrada'
      });
    }

    const classroom = await deactivateClassroom(id);

    res.json({
      success: true,
      message: 'Aula desactivada correctamente',
      data: classroom
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};