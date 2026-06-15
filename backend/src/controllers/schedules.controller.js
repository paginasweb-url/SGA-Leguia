import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByClassroom,
  getSchedulesByTeacher
} from '../services/schedules.service.js';

export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await getSchedules();

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await getScheduleById(id);

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewSchedule = async (req, res) => {
  try {
    const {
      aula_id,
      curso_id,
      docente_id,
      dia_semana,
      hora_inicio,
      hora_fin
    } = req.body;

    if (!aula_id || !curso_id || !docente_id || !dia_semana || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        error: 'Aula, curso, docente, día y horas son obligatorios'
      });
    }

    const schedule = await createSchedule(req.body);

    res.status(201).json({
      success: true,
      message: 'Horario creado correctamente',
      data: schedule
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await updateSchedule(id, req.body);

    res.json({
      success: true,
      message: 'Horario actualizado correctamente',
      data: schedule
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await deleteSchedule(id);

    res.json({
      success: true,
      message: 'Horario eliminado correctamente',
      data: schedule
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getClassroomSchedules = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const schedules = await getSchedulesByClassroom(classroomId);

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getTeacherSchedules = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const schedules = await getSchedulesByTeacher(teacherId);

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};