import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  getAnnouncementsForUser,
  confirmAnnouncementRead,
  getAnnouncementReadSummary
} from '../services/announcements.service.js';

export const createNewAnnouncement = async (req, res) => {
  try {
    const { titulo, contenido, destinatario_tipo, aula_id } = req.body;

    if (!titulo || !contenido) {
      return res.status(400).json({
        success: false,
        error: 'Título y contenido son obligatorios'
      });
    }

    const announcement = await createAnnouncement({
      titulo,
      contenido,
      destinatario_tipo,
      aula_id,
      publicado_por: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Comunicado publicado correctamente',
      data: announcement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await getAnnouncements();

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await getAnnouncementById(id);

    res.json({
      success: true,
      data: announcement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getMyAnnouncements = async (req, res) => {
  try {
    const announcements = await getAnnouncementsForUser(
      req.user.id,
      req.user.rol
    );

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const markAnnouncementAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const read = await confirmAnnouncementRead(id, req.user.id);

    res.json({
      success: true,
      message: 'Lectura confirmada correctamente',
      data: read
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getReadSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const summary = await getAnnouncementReadSummary(id);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};