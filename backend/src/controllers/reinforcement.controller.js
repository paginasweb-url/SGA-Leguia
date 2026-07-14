import {
  getReinforcements,
  getReinforcementById,
  getReinforcementCandidates,
  getAvailableReinforcementTeachers,
  getAvailableReinforcementClassrooms,
  createReinforcement,
  updateReinforcement,
  cancelReinforcement,
  completeReinforcement,
  respondReinforcementStudent,
  saveReinforcementAttendance
} from '../services/reinforcement.service.js';

export const getReinforcementsRequest = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    const { estado, desde, hasta, curso_id } = req.query;

    const data = await getReinforcements({
      userId,
      rol,
      estado,
      desde,
      hasta,
      curso_id
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getReinforcementByIdRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, rol } = req.user;

    const data = await getReinforcementById({
      id,
      userId,
      rol
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

export const getReinforcementCandidatesRequest = async (req, res) => {
  try {
    const { aula_origen_id, curso_id, periodo_id, bimestre } = req.query;

    const data = await getReinforcementCandidates({
      aula_origen_id,
      curso_id,
      periodo_id,
      bimestre
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getAvailableTeachersRequest = async (req, res) => {
  try {
    const { curso_id, fecha, hora_inicio, hora_fin } = req.query;

    const data = await getAvailableReinforcementTeachers({
      curso_id,
      fecha,
      hora_inicio,
      hora_fin
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getAvailableClassroomsRequest = async (req, res) => {
  try {
    const { turno, fecha, hora_inicio, hora_fin } = req.query;

    const data = await getAvailableReinforcementClassrooms({
      turno,
      fecha,
      hora_inicio,
      hora_fin
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const createReinforcementRequest = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await createReinforcement({
      data: req.body,
      userId
    });

    res.status(201).json({
      success: true,
      message: result.notificaciones_generadas > 0
        ? `Reforzamiento creado correctamente. Se generaron ${result.notificaciones_generadas} notificación(es).`
        : 'Reforzamiento creado correctamente.',
      data: result
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const updateReinforcementRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const data = await updateReinforcement({
      id,
      data: req.body,
      userId
    });

    res.json({
      success: true,
      message: 'Reforzamiento actualizado correctamente.',
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const cancelReinforcementRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const { id: userId } = req.user;

    const data = await cancelReinforcement({
      id,
      userId,
      motivo
    });

    res.json({
      success: true,
      message: 'Reforzamiento cancelado correctamente.',
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const completeReinforcementRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    const { id: userId } = req.user;

    const data = await completeReinforcement({
      id,
      userId,
      observacion
    });

    res.json({
      success: true,
      message: 'Reforzamiento completado correctamente. Las alertas académicas relacionadas fueron resueltas.',
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const respondReinforcementStudentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, respuesta } = req.body;
    const { id: userId } = req.user;

    const data = await respondReinforcementStudent({
      assignmentId: id,
      userId,
      estado,
      respuesta
    });

    res.json({
      success: true,
      message: estado === 'aceptado'
        ? 'Participación aceptada correctamente.'
        : 'Participación rechazada correctamente.',
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const saveReinforcementAttendanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { asistencias } = req.body;
    const { id: userId } = req.user;

    const data = await saveReinforcementAttendance({
      reinforcementId: id,
      asistencias,
      userId
    });

    res.json({
      success: true,
      message: 'Asistencia de reforzamiento registrada correctamente.',
      data
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};