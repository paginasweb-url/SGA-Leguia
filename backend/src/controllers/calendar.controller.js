import {
  getCalendarEvents,
  getCalendarClassrooms,
  createCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent
} from '../services/calendar.service.js';

export const getCalendarEventsRequest = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    const { estado, desde, hasta, tipo_evento } = req.query;

    const events = await getCalendarEvents({
      userId,
      rol,
      estado,
      desde,
      hasta,
      tipo_evento
    });

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getCalendarClassroomsRequest = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;

    const classrooms = await getCalendarClassrooms({
      userId,
      rol
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

export const createCalendarEventRequest = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;

    const result = await createCalendarEvent({
      data: req.body,
      userId,
      rol
    });

    res.status(201).json({
      success: true,
      message: result.notificaciones_generadas > 0
        ? `Evento creado correctamente. Se generaron ${result.notificaciones_generadas} notificación(es).`
        : 'Evento creado correctamente.',
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

export const updateCalendarEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, rol } = req.user;

    const event = await updateCalendarEvent({
      id,
      data: req.body,
      userId,
      rol
    });

    res.json({
      success: true,
      message: 'Evento actualizado correctamente.',
      data: event
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const cancelCalendarEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const { id: userId, rol } = req.user;

    const event = await cancelCalendarEvent({
      id,
      userId,
      rol,
      motivo
    });

    res.json({
      success: true,
      message: 'Evento cancelado correctamente.',
      data: event
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};