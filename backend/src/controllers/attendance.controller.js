import {
  getStudentsByClassroom,
  saveClassroomAttendance,
  getAttendanceByClassroomAndDate,
  getAttendanceByStudent,
  getAttendanceSummaryByClassroom,
  getActiveClassroomsForAttendance,
  getAttendanceForUser
} from '../services/attendance.service.js';

const getTodayDate = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

export const getClassroomStudentsForAttendance = async (req, res) => {
  try {
    const { aulaId } = req.params;

    const students = await getStudentsByClassroom(aulaId);

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

export const registerClassroomAttendance = async (req, res) => {
  try {
    const { aula_id, fecha, asistencias } = req.body;

    if (!aula_id || !fecha || !Array.isArray(asistencias)) {
      const fechaSolicitada = String(fecha).slice(0, 10);
      const fechaActual = getTodayDate();

      if (fechaSolicitada !== fechaActual) {
        return res.status(400).json({
          success: false,
          error: 'Solo se puede registrar o modificar asistencia del día actual'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Aula, fecha y lista de asistencias son obligatorios'
      });
    }

    const result = await saveClassroomAttendance({
      aula_id,
      fecha,
      asistencias
    });

    res.status(201).json({
      success: true,
      message: 'Asistencia registrada correctamente',
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

export const getClassroomAttendanceByDate = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        error: 'La fecha es obligatoria'
      });
    }

    const attendance = await getAttendanceByClassroomAndDate(aulaId, fecha);

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const attendance = await getAttendanceByStudent(studentId);

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getClassroomAttendanceSummary = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { fecha, fechaInicio, fechaFin } = req.query;

    const summary = await getAttendanceSummaryByClassroom(
      aulaId,
      fecha || fechaInicio,
      fechaFin
    );

    res.json({
      success: true,
      filters: {
        aulaId,
        fecha: fecha || null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null
      },
      data: summary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAttendanceClassrooms = async (req, res) => {
  try {
    const classrooms = await getActiveClassroomsForAttendance();

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

export const getMyAttendance = async (req, res) => {
  try {
    const attendance = await getAttendanceForUser({
      userId: req.user.id,
      rol: req.user.rol
    });

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};